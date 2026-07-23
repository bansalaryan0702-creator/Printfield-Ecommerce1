const Database = require('better-sqlite3');
const db = new Database('local_cache.db');

const rows = db.prepare('SELECT doc_id, data FROM firestore_cache WHERE collection_name = \'products\'').all();
let c = 0;

function mapCategory(oldCat) {
  const o = oldCat.toLowerCase();
  
  // Business Cards
  if (o.includes('business card') || o.includes('id card') || o.includes('lanyard') || o.includes('visiting card')) {
    return 'Business Cards';
  }
  
  // Custom Apparel
  if (o.includes('t-shirt') || o.includes('apparel') || o.includes('cap') || o.includes('hoodie') || o.includes('jersey') || o.includes('sweatshirt')) {
    return 'Custom Apparel';
  }
  
  // Packaging
  if (o.includes('packaging') || o.includes('box') || o.includes('bag') || o.includes('tape') || o.includes('label') || o.includes('sticker') || o.includes('pouch') || o.includes('envelope') || o.includes('tissue')) {
    return 'Packaging';
  }
  
  // Signage & Posters
  if (o.includes('sign') || o.includes('poster') || o.includes('banner') || o.includes('decal') || o.includes('name plate') || o.includes('standee') || o.includes('canvas')) {
    return 'Signage & Posters';
  }
  
  // Marketing Materials
  if (o.includes('flyer') || o.includes('brochure') || o.includes('menu') || o.includes('letterhead') || o.includes('stationery') || o.includes('document') || o.includes('folder') || o.includes('dangler') || o.includes('bill book') || o.includes('notepad')) {
    return 'Marketing Materials';
  }
  
  // Corporate Gifts (fallback for most other things)
  return 'Corporate Gifts';
}

for (const row of rows) {
  const data = JSON.parse(row.data);
  const oldCategory = data.category || '';
  const newCategory = mapCategory(oldCategory);
  
  // Set original as subCategory if not already set, or just overwrite subCategory
  data.subCategory = oldCategory;
  data.category = newCategory;
  
  db.prepare('UPDATE firestore_cache SET data = ? WHERE doc_id = ? AND collection_name = \'products\'').run(JSON.stringify(data), row.doc_id);
  c++;
}

console.log('Fixed categories for', c, 'products.');
