const fs = require('fs');
let code = fs.readFileSync('src/components/DesignEditor.tsx', 'utf8');
code = code.replace(/Crop, Wand2, Zap/g, 'Crop, Zap'); // Remove duplicate Wand2
code = code.replace(/upscale\?: boolean;/g, '');
code = code.replace(/locked\?: boolean;/g, 'locked?: boolean;\n  upscale?: boolean;'); // add upscale to DesignLayer interface
fs.writeFileSync('src/components/DesignEditor.tsx', code);
