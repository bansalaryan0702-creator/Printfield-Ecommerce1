import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const helper = `
function formatPrivateKey(key: string | undefined): string {
  if (!key) return '';
  let formatted = key.replace(/\\\\n/g, '\\n');
  formatted = formatted.replace(/^"|"$/g, '');
  if (!formatted.includes('\\n')) {
     formatted = formatted.replace(/(-----BEGIN[A-Z\\s]+KEY-----)\\s*(.*?)\\s*(-----END[A-Z\\s]+KEY-----)/s, (match, p1, p2, p3) => {
         return \`\${p1}\\n\${p2.replace(/\\s+/g, '\\n')}\\n\${p3}\`;
     });
  }
  return formatted;
}
`;

content = content.replace(/import express from 'express';/, \`import express from 'express';\${helper}\`);

content = content.replace(/private_key: process\.env\.GOOGLE_PRIVATE_KEY\.replace\(\/\\\\n\/g, '\\\\n'\),/g, 'private_key: formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY),');

fs.writeFileSync('server.ts', content);
console.log("Patched private key handling.");
