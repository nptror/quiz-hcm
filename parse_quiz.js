const fs = require('fs');

const md = fs.readFileSync('quiz.md', 'utf8');

// Split by the quizlet separator lines
const blocks = md.split(/\nhttps:\/\/quizlet\.com\/vn\/\d+\/.*?\n/);

// Also split by "---" separator
const allBlocks = [];
blocks.forEach(block => {
    const parts = block.split(/\n---\n/);
    allBlocks.push(...parts);
});

// Clean text
function clean(text) {
    if (!text) return '';
    return text
        .replace(/\?\s*\(NHUNG\s+HOÀNG\)/gi, '')
        .replace(/\(NHUNG\s+HOÀNG\)/gi, '')
        .replace(/\(073-356-8678\)/g, '')
        .replace(/NHUNG\s+HOÀNG/gi, '')
        .replace(/\(\s*\)\s*$/g, '')
        .trim();
}

// Parse a single question block
function parseQuestion(block) {
    // Remove (Kiểu hỏi khác: ...) blocks
    block = block.replace(/\(Kiểu hỏi khác:.*?\)/gs, '');
    
    // Try to find question and options
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    if (lines.length < 3) return null;
    
    // Find the answer line - typically a single letter at the end
    // Look for patterns like "A\n", "B\n", "a\n", etc.
    let answer = null;
    let answerLineIdx = -1;
    
    // Check last few non-empty lines for answer
    for (let i = lines.length - 1; i >= 0; i--) {
        const l = lines[i].trim();
        if (/^[Aa]$/.test(l)) {
            answer = l.toLowerCase();
            answerLineIdx = i;
            break;
        }
        // Also check for "A." or "B." etc as answer markers at the end
        if (i === lines.length - 1 || i === lines.length - 2) {
            if (/^[Aa]$/.test(l)) {
                answer = l.toLowerCase();
                answerLineIdx = i;
                break;
            }
        }
    }
    
    if (!answer) return null;
    
    // Collect everything before the answer as question + options
    const content = lines.slice(0, answerLineIdx).join('\n');
    
    // Try to parse question and options
    // Options typically start with A/B/C/D or a/b/c/d followed by . or )
    const optionPattern = /^([AaDdCcBb])\.\s*/;
    
    let questionText = '';
    const options = {};
    
    let currentPart = 'question';
    let currentOptionKey = '';
    let currentOptionText = '';
    let currentQuestionLines = [];
    
    for (let i = 0; i < lines.length - (lines.length - answerLineIdx); i++) {
        const line = lines[i];
        
        // Check if this is an option line
        const optMatch = line.match(/^([AaBbCcDd])\.\s*(.*)/);
        if (optMatch) {
            // Save previous option if exists
            if (currentOptionKey && currentOptionText) {
                options[currentOptionKey] = clean(currentOptionText);
            }
            currentOptionKey = optMatch[1].toLowerCase();
            currentOptionText = optMatch[2] || '';
            currentPart = 'option';
        } else if (currentPart === 'question') {
            currentQuestionLines.push(line);
        } else if (currentPart === 'option') {
            currentOptionText += ' ' + line;
        }
    }
    
    // Save last option
    if (currentOptionKey && currentOptionText) {
        options[currentOptionKey] = clean(currentOptionText);
    }
    
    questionText = clean(currentQuestionLines.join(' '));
    
    if (!questionText || Object.keys(options).length < 2) return null;
    
    return {
        question: questionText,
        options: options,
        answer: answer
    };
}

// Parse all blocks
const questions = [];
const seen = new Set();

allBlocks.forEach(block => {
    const q = parseQuestion(block);
    if (q) {
        // Create a key for dedup
        const key = q.question.substring(0, 80).toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            questions.push(q);
        }
    }
});

// Generate JS objects
let output = '';
questions.forEach((q, idx) => {
    const id = idx + 1;
    const optionsStr = Object.entries(q.options)
        .map(([k, v]) => `            "${k}": "${v.replace(/"/g, '\\"')}"`)
        .join(',\n');
    
    output += `    {\n        "id": ${id},\n        "question": "${q.question.replace(/"/g, '\\"')}",\n        "options": {\n${optionsStr}\n        },\n        "answer": "${q.answer.toUpperCase()}"\n    },\n`;
});

console.log(`Total unique questions parsed: ${questions.length}`);
fs.writeFileSync('parsed_questions.js', output);
console.log('Written to parsed_questions.js');
