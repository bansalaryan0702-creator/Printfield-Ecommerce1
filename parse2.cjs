const fs = require('fs');
const code = fs.readFileSync('src/components/DesignEditor.tsx', 'utf8');

const returnIndex = code.indexOf('return (');
const returnStr = code.substring(returnIndex);

const lines = returnStr.split('\n');
lines.forEach((line, i) => {
  if (line.match(/set[A-Z][a-zA-Z]+\(/)) {
    if (!line.includes('=>') && !line.includes('function') && !line.includes('onChange') && !line.includes('onClick')) {
      console.log(i + 1, line.trim());
    }
  }
});
