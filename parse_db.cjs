const fs = require('fs');

const dbBuffer = fs.readFileSync('local_cache.db');
const dbStr = dbBuffer.toString('utf8');

const products = {};

// Clean way to parse URL using regex, stopping at quote
const regex = /"name":"([^"]+)".*?"image":"(https:\/\/[^"]+)"/g;
let match;
while ((match = regex.exec(dbStr)) !== null) {
  const name = match[1];
  const url = match[2];
  if (!url.includes('unsplash.com') && !url.includes('\u0000')) {
    products[name] = url;
  }
}

const regex2 = /"image":"(https:\/\/[^"]+)".*?"name":"([^"]+)"/g;
while ((match = regex2.exec(dbStr)) !== null) {
  const url = match[1];
  const name = match[2];
  if (!url.includes('unsplash.com') && !url.includes('\u0000')) {
    products[name] = url;
  }
}

// Clean up some binary junk that might have slipped into URLs
for (const key of Object.keys(products)) {
  const url = products[key];
  if (url.match(/[\x00-\x1F]/)) {
     delete products[key];
  }
}

fs.writeFileSync('recovered_images.json', JSON.stringify(products, null, 2));
console.log(`Cleanly recovered images for ${Object.keys(products).length} products!`);
