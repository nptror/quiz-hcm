const fs = require('fs');

const html = fs.readFileSync('ho-chi-minh-thought-quiz.html', 'utf8');
const newQuestions = fs.readFileSync('parsed_questions.js', 'utf8');

// Find the start and end of quizData
const startMarker = 'const quizData = [';
const endMarker = '];\n\n        let currentQuestionIndex = 0;';

const startIdx = html.indexOf(startMarker);
const endIdx = html.indexOf(endMarker, startIdx);

if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find quizData boundaries');
    process.exit(1);
}

const before = html.substring(0, startIdx);
const after = html.substring(endIdx + endMarker.length);

const newHtml = before + 'const quizData = [\n' + newQuestions + '];\n' + after;

fs.writeFileSync('ho-chi-minh-thought-quiz.html', newHtml, 'utf8');
console.log('Replaced quizData successfully');
console.log(`New HTML length: ${newHtml.length}`);
