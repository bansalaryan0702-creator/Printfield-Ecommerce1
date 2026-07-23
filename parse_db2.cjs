const fs = require('fs');

const dbBuffer = fs.readFileSync('local_cache.db');
const dbStr = dbBuffer.toString('utf8');

const products = {};

// Use a regex to extract anything that looks like a product JSON object
const regex = /\{"category":.*?\}/g;
let match;
while ((match = regex.exec(dbStr)) !== null) {
  try {
    const obj = JSON.parse(match[0]);
    if (obj.name && obj.image && typeof obj.image === 'string' && obj.image.startsWith('http') && !obj.image.includes('unsplash.com')) {
      products[obj.name] = obj.image;
    }
  } catch (e) {
    // Ignore invalid JSON
  }
}

// Another format perhaps?
const regex2 = /\{"name":.*?\}/g;
while ((match = regex2.exec(dbStr)) !== null) {
  try {
    const obj = JSON.parse(match[0]);
    if (obj.name && obj.image && typeof obj.image === 'string' && obj.image.startsWith('http') && !obj.image.includes('unsplash.com')) {
      products[obj.name] = obj.image;
    }
  } catch (e) {
  }
}

fs.writeFileSync('recovered_images2.json', JSON.stringify(products, null, 2));
console.log(`Cleanly recovered images for ${Object.keys(products).length} products!`);
