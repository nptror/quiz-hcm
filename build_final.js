const fs = require('fs');

// Load 595 parsed questions
const parsed = JSON.parse(fs.readFileSync('new_parsed_595.json', 'utf8'));
console.log('Parsed questions: ' + parsed.length);

// Load 50 extra questions
const extra = JSON.parse(fs.readFileSync('extra_50.json', 'utf8'));
console.log('Extra questions: ' + extra.length);

// Combine: start with parsed 595, then add extra
// But first check if any extra duplicate parsed ones
function normalize(text) {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
}

const seen = new Set(parsed.map(q => normalize(q.question)));
const newExtras = extra.filter(q => !seen.has(normalize(q.question)));
console.log('Non-duplicate extra: ' + newExtras.length);

// Combine all
const all = [...parsed, ...newExtras];
console.log('Total combined: ' + all.length);

// Assign IDs and build output
let output = '';
all.forEach((q, idx) => {
    const id = idx + 1;
    const optKeys = ['a', 'b', 'c', 'd'].filter(k => q.options[k] !== undefined);
    const optionsStr = optKeys
        .map(k => `            "${k}": "${(q.options[k] || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
        .join(',\n');
    
    const questionEsc = q.question.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    output += `    {\n        "id": ${id},\n        "question": "${questionEsc}",\n        "options": {\n${optionsStr}\n        },\n        "answer": "${q.answer}"\n    },\n`;
});

fs.writeFileSync('final_quiz_data.js', output, 'utf8');
console.log('Saved final_quiz_data.js with ' + all.length + ' questions');
