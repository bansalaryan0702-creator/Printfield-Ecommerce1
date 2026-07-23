import fs from 'fs';
const data = fs.readFileSync('public/models/shirt_baked.glb');
console.log(data.slice(0, 50).toString('hex'));
