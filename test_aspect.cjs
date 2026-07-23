const fs = require('fs');
const file = 'src/pages/ProductDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `    baseClass: "w-[15%] -translate-y-[100%] translate-x-[100%]",`;
const repl = `    baseClass: "w-[15%] aspect-square -translate-y-[100%] translate-x-[100%]",`;

console.log(content.includes(target));
