const fs = require('fs');
const buffer = fs.readFileSync('public/models/shirt_baked.glb');
console.log('First 32 bytes hex:', buffer.subarray(0, 32).toString('hex'));
console.log('First 100 bytes ascii:', buffer.subarray(0, 100).toString('utf8'));
