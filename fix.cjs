const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

// The `/>` was added incorrectly to `className=...` and `placeholder=...` which should only be closed once.
// And it seems some inputs are completely broken. 
// Let's replace the broken lines.

// 746-749
code = code.replace(
  /className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" \/>\n                      placeholder="e\.g\. Premium Cotton T-shirt" \/>/g,
  'className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"\n                      placeholder="e.g. Premium Cotton T-shirt"\n                    />'
);

// 756-757
code = code.replace(
  /className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" \/>\n                        placeholder="Enter or select category" \/>/g,
  'className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"\n                        placeholder="Enter or select category"\n                      />'
);

// 772-773
code = code.replace(
  /className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" \/>\n                        placeholder="e\.g\. T-Shirts" \/>/g,
  'className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"\n                        placeholder="e.g. T-Shirts"\n                      />'
);

// 810 (Expected ">" but found "<" because of line 808 missing />)
code = code.replace(
  /placeholder="https:\/\/..."\n\n                      <label/g,
  'placeholder="https://..."\n                    />\n\n                      <label'
);

// 781-782
code = code.replace(
  /className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" \/>\n\n                  <\/div>/g,
  'className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" \/>\n\n                  <\/div>'
);

fs.writeFileSync('src/pages/Admin.tsx', code);
