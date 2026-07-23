const fs = require('fs');

const dbBuffer = fs.readFileSync('local_cache.db');
const dbStr = dbBuffer.toString('utf8');

const products = {};
const chunks = dbStr.split('{"');

for (let i = 1; i < chunks.length; i++) {
  const chunk = '{"' + chunks[i];
  // we want to find the end of the JSON object
  // A simple hack: keep adding characters until JSON.parse succeeds
  let parsed = null;
  
  // since this can be very slow, let's just find the next newline or matching brace
  // actually, SQLite strings often have no newlines in the JSON except escaped ones
  const match = chunk.match(/^(.*?\})/);
  if (match) {
    // Try to parse using regexes instead of full JSON to be fast and forgiving
    const nameMatch = chunk.match(/"name":"([^"]+)"/);
    const imgMatch = chunk.match(/"image":"(https:\/\/[^"]+)"/);
    const imgsMatch = chunk.match(/"images":"\[([^\]]*)\]"/);
    
    if (nameMatch) {
       const name = nameMatch[1];
       if (imgMatch) {
          const url = imgMatch[1];
          if (!url.includes('unsplash.com') && !url.includes('\\u0000')) {
             if (!products[name]) products[name] = { image: url, images: [] };
             else products[name].image = url;
          }
       }
       
       if (imgsMatch) {
          const imgsStr = imgsMatch[1];
          const urls = [...imgsStr.matchAll(/"(https:\/\/[^"]+)"/g)].map(m => m[1]);
          const validUrls = urls.filter(u => !u.includes('unsplash.com') && !u.includes('\\u0000'));
          
          if (validUrls.length > 0) {
             if (!products[name]) products[name] = { image: validUrls[0], images: validUrls };
             else products[name].images = validUrls;
          }
       }
    }
  }
}

// Clean up some binary junk that might have slipped into URLs
for (const key of Object.keys(products)) {
  const obj = products[key];
  if (obj.image.match(/[\x00-\x1F]/)) {
     delete products[key];
  }
}

fs.writeFileSync('recovered_all.json', JSON.stringify(products, null, 2));
console.log(`Cleanly recovered images for ${Object.keys(products).length} products!`);
