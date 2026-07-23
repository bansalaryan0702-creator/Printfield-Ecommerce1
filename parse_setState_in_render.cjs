const fs = require('fs');
const code = fs.readFileSync('src/components/DesignEditor.tsx', 'utf8');
const lines = code.split('\n');
let insideRender = false;
let returnCount = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('return (') && line.includes('className="fixed inset-0')) {
    insideRender = true;
  }
  if (insideRender && line.match(/^\s*set[A-Z]/)) {
    console.log((i + 1) + ": " + line);
  }
}
