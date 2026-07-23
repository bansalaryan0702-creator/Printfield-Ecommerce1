const fs = require('fs');
const code = fs.readFileSync('src/components/DesignEditor.tsx', 'utf8');

const returnIndex = code.indexOf('return (');
const returnStr = code.substring(returnIndex);

const matches = returnStr.match(/set[A-Z][a-zA-Z]+\(/g);
console.log([...new Set(matches)]);
