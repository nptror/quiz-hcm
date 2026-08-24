const fs = require('fs');
const md = fs.readFileSync('quiz.md', 'utf8');

function clean(text) {
    if (!text) return '';
    return text
        .replace(/\?\s*\(NHUNG\s+HOANG\)/gi, '')
        .replace(/\(NHUNG\s+HOANG\)/gi, '')
        .replace(/\(073-356-8678\)/g, '')
        .replace(/\(Kieu hoi khac:[\s\S]*?\)/g, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

const lines = md.split('\n');
const questions = [];
const skippedBlocks = [];
let i = 0;

while (i < lines.length) {
    const line = lines[i].trim();
    if (!line || line === '---' || line.match(/^15:29/) || line.match(/^https:\/\/quizlet/) ||
        line.match(/^HCM202/) || line.match(/^#/) || line.match(/^\d+\.\d+/) ||
        line.match(/^Thu/) || line.match(/^Trong nhom/) || line.match(/^Luu/) || line.match(/^The ghi nho/)) {
        i++; continue;
    }
    const isOptionLine = /^[AaBbCcDd]\.\s/.test(line);
    if (!isOptionLine && line.length > 10) {
        const startLine = i;
        let questionLines = [line];
        i++;
        while (i < lines.length) {
            const nextLine = lines[i].trim();
            if (!nextLine || nextLine === '---' || nextLine.match(/^15:29/) || nextLine.match(/^https:\/\/quizlet/)) break;
            if (/^[AaBbCcDd]\.\s/.test(nextLine) || /^[AaBbCcDd]$/.test(nextLine)) break;
            questionLines.push(nextLine);
            i++;
        }
        let questionText = clean(questionLines.join(' '));
        const options = {};
        while (i < lines.length) {
            const optLine = lines[i].trim();
            if (!optLine || optLine === '---' || optLine.match(/^15:29/) || optLine.match(/^https:\/\/quizlet/)) break;
            const optMatch = optLine.match(/^([AaBbCcDd])\.\s*(.*)/);
            if (optMatch) {
                const key = optMatch[1].toLowerCase();
                let optText = optMatch[2] || '';
                i++;
                while (i < lines.length) {
                    const nextOptLine = lines[i].trim();
                    if (!nextOptLine || nextOptLine === '---' || nextOptLine.match(/^15:29/) || nextOptLine.match(/^https:\/\/quizlet/)) break;
                    if (/^[AaBbCcDd]\.\s/.test(nextOptLine) || /^[AaBbCcDd]$/.test(nextOptLine)) break;
                    optText += ' ' + nextOptLine;
                    i++;
                }
                options[key] = clean(optText);
            } else break;
        }
        let answer = null;
        while (i < lines.length) {
            const ansLine = lines[i].trim();
            if (!ansLine || ansLine === '---' || ansLine.match(/^15:29/) || ansLine.match(/^https:\/\/quizlet/)) { i++; continue; }
            if (/^[AaBbCcDd]$/.test(ansLine)) { answer = ansLine.toLowerCase(); i++; break; }
            if (/^[AaBbCcDd]{2,4}$/.test(ansLine)) { answer = ansLine[0].toLowerCase(); i++; break; }
            break;
        }
        const numOptions = Object.keys(options).length;
        if (questionText && numOptions >= 2 && answer) {
            questions.push({ question: questionText, options, answer: answer.toUpperCase() });
        } else if (questionText) {
            skippedBlocks.push({ lineNum: startLine+1, q: questionText.substring(0,80), numOptions, answer, reason: !numOptions ? 'no_options' : !answer ? 'no_answer' : 'other' });
        }
    } else { i++; }
}

const seen = new Set();
const unique = [];
const duplicates = [];
questions.forEach(q => {
    const key = q.question.substring(0, 60).toLowerCase();
    if (!seen.has(key)) { seen.add(key); unique.push(q); }
    else duplicates.push(q.question.substring(0, 80));
});

console.log('Total parsed: ' + questions.length);
console.log('Unique: ' + unique.length);
console.log('Duplicates removed: ' + duplicates.length);
console.log('Skipped blocks: ' + skippedBlocks.length);
console.log('--- SKIPPED (first 40) ---');
skippedBlocks.slice(0, 40).forEach(b => console.log('Line ' + b.lineNum + ' [' + b.reason + '] opts=' + b.numOptions + ' ans=' + b.answer + ': ' + b.q));
