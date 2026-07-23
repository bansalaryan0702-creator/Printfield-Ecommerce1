const fs = require('fs');
const buffer = fs.readFileSync('public/models/shirt_baked.glb');
// Check GLB header magic: first 4 bytes must be 0x46546C67 ("glTF" in ASCII)
const magic = buffer.toString('utf8', 0, 4);
const version = buffer.readUInt32LE(4);
const length = buffer.readUInt32LE(8);
console.log('GLB Magic:', magic);
console.log('GLB Version:', version);
console.log('GLB Length:', length, 'File Size:', buffer.length);
