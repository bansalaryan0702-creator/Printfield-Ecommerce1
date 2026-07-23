import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/fs\.promises\.mkdir/g, 'fs.mkdir');
content = content.replace(/fs\.promises\.writeFile/g, 'fs.writeFile');
content = content.replace(/fs\.promises\.access/g, 'fs.access');
content = content.replace(/fs\.promises\.unlink/g, 'fs.unlink');
content = content.replace(/fs\.promises\.readFile/g, 'fs.readFile');

fs.writeFileSync('server.ts', content);
console.log("Patched fs.promises");
