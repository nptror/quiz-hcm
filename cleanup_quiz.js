import { readFileSync, writeFileSync } from 'fs';

function cleanDataFile(path) {
  const raw = readFileSync(path, 'utf-8');
  // Match the JSON array part
  const match = raw.match(/= (\[[\s\S]*\]);/);
  if (!match) { console.log('No data found in', path); return; }
  
  let data = JSON.parse(match[1]);
  
  data = data.map((q, i) => {
    // Clean question text
    q.question = q.question
      .replace(/\(Kiểu hỏi khác:[^)]*\)/gi, '')  // remove Kiểu hỏi khác blocks
      .replace(/\(Khác:[^)]*\)/gi, '')
      .replace(/\(Đánh giá[^)]*\)/gi, '')
      .replace(/\(NHUNG HOÀNG\)/gi, '')
      .replace(/\(không[^)]*\)/gi, '')
      .replace(/\(chịu[^)]*\)/gi, '')
      .replace(/\(là[^)]*\)/gi, '')
      .replace(/\(073[^)]*\)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Remove leaked option text from question (e.g. "question text A. option1 B. option2...")
    // Detect if question contains option-like patterns
    const optPattern = /\s+([A-Da-d][\.\)]\s+[^\n]+?)(?:\s+[A-Da-d][\.\)]\s+|$)/;
    const mergedMatch = q.question.match(/^(.+?)\s+[A-Da-d][\.\)]\s+/);
    if (mergedMatch) {
      // Check if this looks like question text got merged with options from a previous question
      const beforeOpts = mergedMatch[1].trim();
      // Only clean if the merged part looks like it has embedded options
      if (q.question.match(/[A-Da-d][\.\)]\s+.{10,}/)) {
        q.question = beforeOpts;
      }
    }
    
    // Clean trailing "=>" artifacts
    q.question = q.question.replace(/=>.*$/g, '').trim();
    
    // If question text is empty or very short, skip
    if (q.question.length < 5) return null;
    
    // Clean options
    for (const key of Object.keys(q.options)) {
      q.options[key] = q.options[key]
        .replace(/\(NHUNG HOÀNG\)/gi, '')
        .replace(/\(không[^)]*\)/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    return q;
  }).filter(Boolean);
  
  const varName = path.includes('vnr') ? 'vnrData' : 'mlnData';
  const content = `const ${varName} = ${JSON.stringify(data, null, 2)};\nexport default ${varName};\n`;
  writeFileSync(path, content, 'utf-8');
  console.log(`${path}: ${data.length} questions (cleaned)`);
}

cleanDataFile('my-quiz/src/vnrData.js');
cleanDataFile('my-quiz/src/mlnData.js');
