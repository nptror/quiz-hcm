const fs = require('fs');
const md = fs.readFileSync('quiz.md', 'utf8');

function clean(text) {
    if (!text) return '';
    return text
        .replace(/\?\s*\(NHUNG\s+HOÀNG\)/gi, '')
        .replace(/\(NHUNG\s+HOÀNG\)/gi, '')
        .replace(/\(073-356-8678\)/g, '')
        .replace(/\(Kiểu hỏi khác:[\s\S]*?\)/g, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Split into lines
const lines = md.split('\n');

const questions = [];
let i = 0;

// Skip to first question
while (i < lines.length) {
    const line = lines[i].trim();
    
    // Skip empty lines, separator lines, quizlet footer, timestamps
    if (!line || 
        line === '---' ||
        line.match(/^15:29/) ||
        line.match(/^https:\/\/quizlet/) ||
        line.match(/^HCM202/) ||
        line.match(/^#/) ||
        line.match(/^\d+\.\d+/) ||
        line.match(/^Thu/) ||
        line.match(/^Trong nhóm/) ||
        line.match(/^Lưu/) ||
        line.match(/^Thẻ ghi nhớ/)) {
        i++;
        continue;
    }
    
    // Check if this line looks like a question (longer text, not a single option letter)
    // A question typically doesn't start with A/B/C/D followed by a period
    const isOptionLine = /^[AaBbCcDd]\.\s/.test(line);
    
    if (!isOptionLine && line.length > 10) {
        // This might be a question line
        // Collect the full question text (may span multiple lines until we hit option lines)
        let questionLines = [];
        questionLines.push(line);
        i++;
        
        // Continue collecting until we hit an option line
        while (i < lines.length) {
            const nextLine = lines[i].trim();
            if (!nextLine || nextLine === '---' || nextLine.match(/^15:29/) || nextLine.match(/^https:\/\/quizlet/)) {
                break;
            }
            // Check if next line is an option
            if (/^[AaBbCcDd]\.\s/.test(nextLine)) {
                break;
            }
            // If next line is a single letter answer (A, B, C, D, a, b, c, d)
            if (/^[AaBbCcDd]$/.test(nextLine)) {
                break;
            }
            questionLines.push(nextLine);
            i++;
        }
        
        let questionText = clean(questionLines.join(' '));
        
        // Now collect options
        const options = {};
        while (i < lines.length) {
            const optLine = lines[i].trim();
            if (!optLine || optLine === '---' || optLine.match(/^15:29/) || optLine.match(/^https:\/\/quizlet/)) {
                break;
            }
            
            const optMatch = optLine.match(/^([AaBbCcDd])\.\s*(.*)/);
            if (optMatch) {
                const key = optMatch[1].toLowerCase();
                let optText = optMatch[2] || '';
                i++;
                // Collect multi-line option
                while (i < lines.length) {
                    const nextOptLine = lines[i].trim();
                    if (!nextOptLine || nextOptLine === '---' || nextOptLine.match(/^15:29/) || nextOptLine.match(/^https:\/\/quizlet/)) {
                        break;
                    }
                    if (/^[AaBbCcDd]\.\s/.test(nextOptLine) || /^[AaBbCcDd]$/.test(nextOptLine)) {
                        break;
                    }
                    optText += ' ' + nextOptLine;
                    i++;
                }
                options[key] = clean(optText);
            } else {
                break;
            }
        }
        
        // Now look for the answer
        let answer = null;
        while (i < lines.length) {
            const ansLine = lines[i].trim();
            if (!ansLine || ansLine === '---' || ansLine.match(/^15:29/) || ansLine.match(/^https:\/\/quizlet/) || ansLine.match(/^\(Kiểu hỏi/)) {
                i++;
                continue;
            }
            if (/^[AaBbCcDd]$/.test(ansLine)) {
                answer = ansLine.toLowerCase();
                i++;
                break;
            }
            // If it's not a single letter, might be part of next question
            break;
        }
        
        if (questionText && Object.keys(options).length >= 2 && answer) {
            questions.push({
                question: questionText,
                options: options,
                answer: answer.toUpperCase()
            });
        }
    } else {
        i++;
    }
}

// Deduplicate
const seen = new Set();
const unique = [];
questions.forEach(q => {
    const key = q.question.substring(0, 60).toLowerCase();
    if (!seen.has(key)) {
        seen.add(key);
        unique.push(q);
    }
});

// Generate output
let output = '';
unique.forEach((q, idx) => {
    const id = idx + 1;
    const optionsStr = Object.entries(q.options)
        .map(([k, v]) => `            "${k}": "${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
        .join(',\n');
    
    output += `    {\n        "id": ${id},\n        "question": "${q.question.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}",\n        "options": {\n${optionsStr}\n        },\n        "answer": "${q.answer}"\n    },\n`;
});

console.log(`Total unique questions: ${unique.length}`);
fs.writeFileSync('parsed_questions.js', output);
console.log('Done');
