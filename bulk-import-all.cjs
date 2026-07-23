const cheerio = require('cheerio');
const fs = require('fs');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGFkbWluLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4NDYzMDQ3MiwiZXhwIjoxODE2MTg4MDcyfQ.-NeT3AWwhcHMn0nOkefHGESogITd3NuEjUNZDu97lPQ';

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getCategories() {
  const res = await fetch('https://printo.in/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);
  const nextData = $('script#__NEXT_DATA__').html();
  if (!nextData) return [];
  const data = JSON.parse(nextData);
  const entities = data.props?.pageProps?.initialProps?.categoryEntities || {};
  const slugs = [];
  for (const key in entities) {
    if (entities[key].url_slug) slugs.push(entities[key].url_slug);
  }
  return slugs;
}

async function getProductsForCategory(categorySlug) {
  const res = await fetch(`https://printo.in/categories/${categorySlug}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);
  const links = new Set();
  $('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('/customizable-products/')) {
       const clean = href.split('?')[0];
       links.add(clean.startsWith('http') ? clean : 'https://printo.in' + clean);
    }
  });
  return Array.from(links);
}

const productQueue = [];

async function worker(id) {
  while (productQueue.length > 0) {
    const pUrl = productQueue.shift();
    console.log(`[Worker ${id}] Importing: ${pUrl} (${productQueue.length} remaining)`);
    try {
        const importRes = await fetch('http://localhost:3000/api/import-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ url: pUrl })
        });
        const importData = await importRes.json();
        
        if (importData.error) {
           console.log(`[Worker ${id}] Error parsing ${pUrl}: ${importData.error}`);
           continue;
        }

        const data = importData.data;
        const payload = {
          name: data.name || '',
          description: data.description || '',
          card_description: data.cardDescription || '',
          price: parseFloat(data.price || '0'),
          min_qty: parseInt(data.minQty || '1', 10),
          qty_multiple: parseInt(data.qtyMultiple || '1', 10),
          category: data.category || '',
          sub_category: data.subCategory || '',
          image_url: data.image || '',
          image_urls: data.images || [],
          features: data.features ? data.features.join(', ') : '',
          colors: data.colors ? data.colors.map(c => ({ name: c.name || '', hex: c.hex || '#000000', image: '' })) : [],
          variations: data.variations ? data.variations.map(v => ({
            id: v.id || v.name?.toLowerCase().replace(/\s+/g, '-'),
            name: v.name || '',
            options: v.options || []
          })) : []
        };

        const saveRes = await fetch('http://localhost:3000/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        
        if (saveRes.ok) {
           console.log(`[Worker ${id}] Saved ${payload.name}`);
        } else {
           const err = await saveRes.json();
           console.log(`[Worker ${id}] Save error: ${err.error}`);
        }
    } catch (e) {
      console.log(`[Worker ${id}] Exception: ${e.message}`);
    }
  }
}

async function run() {
  console.log("Fetching categories...");
  const categories = await getCategories();
  console.log(`Found ${categories.length} categories.`);

  let allProducts = new Set();
  
  // To speed this up, lets batch fetch products per category
  console.log("Gathering all product links...");
  for (const catSlug of categories) {
    try {
        const productUrls = await getProductsForCategory(catSlug);
        for(let pUrl of productUrls) {
            allProducts.add(pUrl);
        }
    } catch (e) {
        // ignore
    }
    await delay(100);
  }
  
  const productArray = Array.from(allProducts);
  console.log(`Gathered ${productArray.length} unique products.`);
  
  for(let pUrl of productArray) {
      productQueue.push(pUrl);
  }
  
  console.log("Starting import workers...");
  const WORKERS = 5;
  const promises = [];
  for (let i = 0; i < WORKERS; i++) {
    promises.push(worker(i));
  }
  
  await Promise.all(promises);
  console.log("All done!");
}

run();
