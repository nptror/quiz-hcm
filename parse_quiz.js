import { readFileSync, writeFileSync } from 'fs';

function parseQuizFile(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  // Split into blocks by --- or by Quizlet footer lines
  const lines = raw.split('\n');
  
  // Remove quizlet footer lines and page numbers
  const cleaned = lines.filter(l => {
    const t = l.trim();
    if (t.match(/^\d{1,2}:\d{2}\s+\d{1,2}\/\d{1,2}\//)) return false;
    if (t.includes('Thẻ ghi nhớ:')) return false;
    if (t.match(/^https:\/\/quizlet\.com/)) return false;
    if (t.match(/^\d+\/\d+$/)) return false;
    if (t === '---') return false;
    if (t.match(/^Thu###/)) return false;
    if (t.match(/^和服务/)) return false;
    if (t.startsWith('Thuật ngữ trong học phần')) return false;
    if (t.startsWith('Thuật ngữ')) return false;
    if (t === 'Ẩn định nghĩa') return false;
    if (t.startsWith('34 người học từ')) return false;
    if (t.startsWith('Thêm vào lịch')) return false;
    if (t.startsWith('Ghép thẻ')) return false;
    if (t.startsWith('Đánh giá')) return false;
    if (t.includes('Cho điểm đánh giá')) return false;
    if (t.includes('Nắm vững nội dung')) return false;
    if (t.includes('LỚP HỌC ĐỘC QUYỀN')) return false;
    if (t.includes('MLN131 HALF')) return false;
    if (t.includes('MLN131 NEW')) return false;
    if (t.includes('Ghép thẻ Khối hộp')) return false;
    return true;
  });
  
  const text = cleaned.join('\n');
  
  // Split into question blocks - each question ends with a single letter answer
  // Pattern: question text, then options, then answer letter
  const questions = [];
  
  let i = 0;
  while (i < cleaned.length) {
    const line = cleaned[i].trim();
    
    // Skip empty lines and headers
    if (!line || line.startsWith('#') || line.startsWith('HCM202') || line.startsWith('MLN131') || line.startsWith('5.0') || line.startsWith('###')) {
      i++;
      continue;
    }
    
    // Try to find a question block starting here
    // Collect lines until we find a standalone answer letter
    let block = [];
    let j = i;
    
    // Skip leading empty lines
    while (j < cleaned.length && !cleaned[j].trim()) j++;
    if (j >= cleaned.length) break;
    
    // Collect the block
    let foundAnswer = false;
    let answerLine = -1;
    while (j < cleaned.length) {
      const l = cleaned[j].trim();
      
      // Check if this line is just an answer letter
      if (l.match(/^[A-Da-d]$/) && block.length > 0) {
        // Check if previous lines contain options
        const hasOptions = block.some(bl => bl.trim().match(/^[A-Da-d][\.\)]/i));
        if (hasOptions) {
          foundAnswer = true;
          answerLine = j;
          break;
        }
      }
      
      // Check for "all answers" line like "D (không thực hiện...)"
      if (l.match(/^[A-Da-d]\s*\(/) && block.length > 0) {
        const hasOptions = block.some(bl => bl.trim().match(/^[A-Da-d][\.\)]/i));
        if (hasOptions) {
          foundAnswer = true;
          answerLine = j;
          break;
        }
      }
      
      block.push(cleaned[j]);
      j++;
    }
    
    if (!foundAnswer || block.length < 2) {
      i = j + 1;
      continue;
    }
    
    // Parse the block into question + options + answer
    const result = parseBlock(block, cleaned[answerLine].trim());
    if (result) {
      questions.push(result);
    }
    
    i = answerLine + 1;
  }
  
  return questions;
}

function parseBlock(lines, answerRaw) {
  let question = '';
  const options = {};
  let inOptions = false;
  let optionKeys = [];
  let currentOptionKey = '';
  let currentOptionText = '';
  
  // Find where options start
  let optionStartIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (l.match(/^[A-Da-d][\.\)]\s+/) || l.match(/^[A-Da-d][\.\)]$/)) {
      optionStartIdx = i;
      break;
    }
  }
  
  if (optionStartIdx === -1) return null;
  
  // Check if first line itself is an option (some questions have "A. ..." as first line)
  // This happens when the question text was on the previous block
  if (optionStartIdx === 0 && lines.length > 2) {
    // The question might be missing or on previous block - skip
    // Actually check if there's a question before options
    // For some entries, question is embedded before the first option
    // Let's check if line 0 looks like "question text A. option"
    const firstLine = lines[0].trim();
    const mergeMatch = firstLine.match(/^(.+?)\s*[A-Da-d][\.\)]\s+(.+)/);
    if (mergeMatch && !firstLine.match(/^[A-Da-d][\.\)]/)) {
      question = mergeMatch[1].trim();
      optionStartIdx = 0;
    } else {
      // Options start at line 0 - question is missing
      return null;
    }
  }
  
  // Get question text
  if (!question) {
    question = lines.slice(0, optionStartIdx).map(l => l.trim()).join(' ').replace(/\s+/g, ' ').trim();
  }
  
  // Remove (NHUNG HOÀNG) tags
  question = question.replace(/\(NHUNG HOÀNG\)/gi, '').trim();
  // Remove leading option labels that leaked into question
  question = question.replace(/^[A-Da-d][\.\)]\s+/, '').trim();
  
  if (!question) return null;
  
  // Parse options
  for (let i = optionStartIdx; i < lines.length; i++) {
    const l = lines[i].trim();
    const optMatch = l.match(/^([A-Da-d])[\.\)]\s*(.*)/);
    if (optMatch) {
      // Save previous option
      if (currentOptionKey) {
        options[currentOptionKey] = currentOptionText.trim().replace(/\s+/g, ' ');
      }
      currentOptionKey = optMatch[1].toLowerCase();
      currentOptionText = optMatch[2] || '';
    } else if (currentOptionKey) {
      // Continuation of current option
      currentOptionText += ' ' + l;
    }
  }
  // Save last option
  if (currentOptionKey) {
    options[currentOptionKey] = currentOptionText.trim().replace(/\s+/g, ' ');
  }
  
  // Must have at least 2 options
  if (Object.keys(options).length < 2) return null;
  
  // Get answer
  let answer = answerRaw.replace(/\s*\(.*\)/, '').trim().toUpperCase();
  if (answer.length > 1) answer = answer[0];
  
  return {
    question: question.replace(/\s+/g, ' ').trim(),
    options,
    answer
  };
}

// Clean up "Kiểu hỏi khác" artifacts from question text
function cleanQuestion(q) {
  // Remove "(Kiểu hỏi khác: ..." at start
  q.question = q.question.replace(/^\(Kiểu hỏi khác:\s*/i, '').trim();
  // Remove trailing ")" if unbalanced
  if (q.question.endsWith(')') && (q.question.match(/\(/g) || []).length < (q.question.match(/\)/g) || []).length) {
    q.question = q.question.slice(0, -1).trim();
  }
  // Remove "=>" artifacts
  q.question = q.question.replace(/=>[^)]*\)/g, '').trim();
  // Clean up options - remove empty or malformed
  for (const key of Object.keys(q.options)) {
    q.options[key] = q.options[key].replace(/\(NHUNG HOÀNG\)/gi, '').replace(/\s+/g, ' ').trim();
  }
  return q;
}

// Process VNR (quiz.md)
console.log('Parsing quiz.md (VNR)...');
const vnrRaw = parseQuizFile('quiz.md');
const vnrData = vnrRaw.map(cleanQuestion).filter(q => q.question && Object.keys(q.options).length >= 2);
console.log(`VNR: ${vnrData.length} questions`);

// Process MLN (MLN-quiz.md)
console.log('Parsing MLN-quiz.md (MLN)...');
const mlnRaw = parseQuizFile('MLN-quiz.md');
const mlnData = mlnRaw.map(cleanQuestion).filter(q => q.question && Object.keys(q.options).length >= 2);
console.log(`MLN: ${mlnData.length} questions`);

// Write data files
function writeDataFile(path, varName, data) {
  const content = `const ${varName} = ${JSON.stringify(data, null, 2)};\nexport default ${varName};\n`;
  writeFileSync(path, content, 'utf-8');
  console.log(`Wrote ${path} (${data.length} questions)`);
}

writeDataFile('my-quiz/src/vnrData.js', 'vnrData', vnrData);
writeDataFile('my-quiz/src/mlnData.js', 'mlnData', mlnData);
