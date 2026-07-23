const fs = require('fs');
// Let's just grep strings in the glb, it's usually clear enough.
const data = fs.readFileSync('public/models/shirt_baked.glb', 'utf8');
const names = data.match(/name[\"\']?\s*:\s*[\"\']([^\"\']+)[\"\']/g);
console.log(names);
