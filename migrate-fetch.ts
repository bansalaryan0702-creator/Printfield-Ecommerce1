import fs from 'fs';
import path from 'path';

const files = [
  'src/components/BulkQuotationPopup.tsx',
  'src/components/OrdersAdmin.tsx',
  'src/components/ProposalsAdmin.tsx',
  'src/pages/Profile.tsx',
  'src/pages/Orders.tsx',
  'src/pages/Login.tsx',
  'src/pages/ProductDetail.tsx',
  'src/pages/Admin.tsx',
  'src/pages/Checkout.tsx',
  'src/hooks/useProducts.ts',
  'src/context/AppContext.tsx'
];

for (const file of files) {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  let newContent = content.replace(/\bfetch\(/g, 'apiFetch(');
  
  if (newContent !== content) {
    if (!newContent.includes('import { apiFetch }')) {
      const depth = file.split('/').length - 2;
      const relativePath = depth === 0 ? './lib/api' : '../'.repeat(depth) + 'lib/api';
      newContent = "import { apiFetch } from '" + relativePath + "';\n" + newContent;
    }
    fs.writeFileSync(filePath, newContent);
    console.log("Updated " + file);
  }
}
