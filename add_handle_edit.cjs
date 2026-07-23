const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const insertPoint = "  const handleRemoveVariationOption = (catIdx: number, optIndex: number) => {";

const handleEditVariationOption = `
  const handleEditVariationOption = (catIdx: number, optIndex: number, field: 'name' | 'price', value: string) => {
    const newVars = [...variations];
    if (field === 'price') {
      newVars[catIdx].options[optIndex][field] = value ? parseInt(value, 10) : 0;
    } else {
      newVars[catIdx].options[optIndex][field] = value;
    }
    setVariations(newVars);
  };
`;

if (code.includes(insertPoint)) {
  code = code.replace(insertPoint, handleEditVariationOption + "\n" + insertPoint);
  fs.writeFileSync('src/pages/Admin.tsx', code);
  console.log("Added handleEditVariationOption");
} else {
  console.log("Could not find insert point");
}
