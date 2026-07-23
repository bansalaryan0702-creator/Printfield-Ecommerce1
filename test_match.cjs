const axios = require('axios');
const fs = require('fs');

const rec1 = JSON.parse(fs.readFileSync('recovered_images.json', 'utf8'));
const rec2 = JSON.parse(fs.readFileSync('recovered_all.json', 'utf8'));

async function run() {
  const res = await axios.get('http://localhost:3000/api/products?limit=2000&includeDisabled=true');
  const prods = res.data.data;
  
  let matchCount = 0;
  for (const p of prods) {
    if (!p.image || p.image.includes('placehold')) {
       if (rec1[p.name] || rec2[p.name]) {
           matchCount++;
       }
    }
  }
  console.log(`Matched ${matchCount} products!`);
}
run();
