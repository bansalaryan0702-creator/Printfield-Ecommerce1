const cheerio = require('cheerio');

async function test() {
  const url = 'https://printo.in/categories/signages-and-banners';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const links = new Set();
  $('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('/customizable-products/')) {
       // Filter out any query params for cleaner URLs
       const clean = href.split('?')[0];
       links.add(clean.startsWith('http') ? clean : 'https://printo.in' + clean);
    }
  });
  
  console.log('Links found via <a> tags:', Array.from(links));
}
test();
