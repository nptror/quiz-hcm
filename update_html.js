const fs = require("fs");

// Read the HTML file
const html = fs.readFileSync("ho-chi-minh-thought-quiz.html", "utf8");

// Read the new quiz data
const newData = fs.readFileSync("final_quiz_data.js", "utf8");

// Find start and end of quizData array
const startMarker = "const quizData = [";
const startIdx = html.indexOf(startMarker);
const dataStart = startIdx + startMarker.length;

// Find the closing ]; after quizData
// Look for "];\n" after the data starts
let depth = 1;
let i = dataStart;
while (i < html.length && depth > 0) {
    if (html[i] === "[") depth++;
    else if (html[i] === "]") depth--;
    i++;
}
const dataEnd = i; // position after the closing ]

console.log("quizData array from", dataStart, "to", dataEnd);

// Build new HTML
const before = html.substring(0, dataStart);
const after = html.substring(dataEnd);

const newHtml = before + "\n" + newData + "\n" + after;

// Update the placeholder text in the HTML (1-589 -> 1-645)
const finalHtml = newHtml
    .replace(/\(1-589\)/g, "(1-645)")
    .replace(/max="589"/g, 'max="645"')
    .replace(/Câu hỏi 1\/63/g, "Câu hỏi 1/645")
    .replace(/"question-index-badge">\s*Câu hỏi \d+\/\d+/g, '"question-index-badge">\n                            Câu hỏi 1/645');

fs.writeFileSync("ho-chi-minh-thought-quiz.html", finalHtml, "utf8");

// Verify count
const verMatch = finalHtml.match(/"question"\s*:/g);
console.log("Verification - question count in HTML:", verMatch ? verMatch.length : 0);
