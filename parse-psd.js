import fs from 'fs';
import { readPsd } from 'ag-psd';

const psdData = fs.readFileSync('node_modules/ag-psd/package.json');
// Just checking if ag-psd is usable in node.
console.log('usable');
