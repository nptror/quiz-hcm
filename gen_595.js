const fs = require('fs');
const md = fs.readFileSync('quiz.md', 'utf8');

function clean(text) {
    if (!text) return '';
    return text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

const lines = md.split('\n');
const questions = [];
let i = 0;

function isJunk(line) {
    return !line || line === '---' || line.match(/^15:29/) || line.match(/^https:\/\/quizlet/) ||
        line.match(/^HCM202/) || line.match(/^#/) || line.match(/^\d+\.\d+/) ||
        line.match(/^Thu/) || line.match(/^Trong nhom/) || line.match(/^Luu/) || line.match(/^The ghi nho/);
}

while (i < lines.length) {
    const line = lines[i].trim();
    if (isJunk(line)) { i++; continue; }
    const isOptionLine = /^[AaBbCcDd]\.\s/.test(line);
    if (!isOptionLine && line.length > 10) {
        let questionLines = [line];
        i++;
        while (i < lines.length) {
            const nextLine = lines[i].trim();
            if (!nextLine || nextLine === '---' || nextLine.match(/^15:29/) || nextLine.match(/^https:\/\/quizlet/)) break;
            if (/^[AaBbCcDd]\.\s/.test(nextLine) || /^[AaBbCcDd]{1,4}$/.test(nextLine)) break;
            questionLines.push(nextLine);
            i++;
        }
        let questionText = clean(questionLines.join(' '));
        questionText = questionText.replace(/\([^)]*[Kk][^)]*kh[^)]*\)/g, '').replace(/\s+/g, ' ').trim();
        questionText = questionText.replace(/\([^)]*HOANG[^)]*\)/gi, '').replace(/\([^)]*NHUNG[^)]*\)/gi, '').replace(/\s+/g, ' ').trim();
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
                    if (/^[AaBbCcDd]\.\s/.test(nextOptLine) || /^[AaBbCcDd]{1,4}$/.test(nextOptLine)) break;
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
            if (/^[AaBbCcDd]$/.test(ansLine)) { answer = ansLine.toUpperCase(); i++; break; }
            if (/^[AaBbCcDd]{2,4}$/.test(ansLine)) { answer = ansLine[0].toUpperCase(); i++; break; }
            break;
        }
        if (questionText && Object.keys(options).length >= 2 && answer) {
            questions.push({ question: questionText, options, answer });
        }
    } else { i++; }
}

function normalize(text) {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
}
const seen = new Set();
const unique = [];
questions.forEach(q => {
    const key = normalize(q.question);
    if (!seen.has(key)) { seen.add(key); unique.push(q); }
});

fs.writeFileSync('new_parsed_595.json', JSON.stringify(unique, null, 2), 'utf8');
console.log('Saved ' + unique.length + ' unique questions to new_parsed_595.json');
