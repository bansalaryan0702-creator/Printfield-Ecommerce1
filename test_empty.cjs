const axios = require('axios');
async function run() {
  const res = await axios.get('http://localhost:3000/api/products?limit=2000&includeDisabled=true');
  const prods = res.data.data;
  
  let neverHadImageCount = 0;
  let hasUnsplash = 0;
  for (const p of prods) {
    if (!p.image || p.image === '') {
       neverHadImageCount++;
    } else if (p.image.includes('unsplash')) {
       hasUnsplash++;
    }
  }
  console.log('Empty image count:', neverHadImageCount);
  console.log('Unsplash image count:', hasUnsplash);
}
run();
