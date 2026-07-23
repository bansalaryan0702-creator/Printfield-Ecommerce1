const fs = require('fs');
let code = fs.readFileSync('src/components/DesignEditor.tsx', 'utf8');
code = code.replace(/Crop,\s*, Wand2/g, 'Crop, Wand2');
fs.writeFileSync('src/components/DesignEditor.tsx', code);
