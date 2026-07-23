const fs = require('fs');

const dbContent = fs.readFileSync('local_cache.db', 'utf-8');
const regex = /\{"category":.*?,"image":"(https:\/\/[^"]+)".*?,"name":"([^"]+)"/g;

let match;
const products = {};

while ((match = regex.exec(dbContent)) !== null) {
  const url = match[1];
  const name = match[2];
  if (!url.includes('unsplash.com')) {
    products[name] = url;
  }
}

const regex2 = /"name":"([^"]+)".*?"image":"(https:\/\/[^"]+)"/g;
while ((match = regex2.exec(dbContent)) !== null) {
  const name = match[1];
  const url = match[2];
  if (!url.includes('unsplash.com')) {
    products[name] = url;
  }
}

fs.writeFileSync('recovered_images.json', JSON.stringify(products, null, 2));
console.log(`Recovered images for ${Object.keys(products).length} products!`);
