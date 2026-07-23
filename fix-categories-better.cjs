const Database = require('better-sqlite3');
const db = new Database('local_cache.db');

const rows = db.prepare('SELECT doc_id, data FROM firestore_cache WHERE collection_name = \'products\'').all();
let c = 0;

function mapCategory(oldCat, name) {
  const o = (oldCat + ' ' + name).toLowerCase();
  
  if (o.includes('business card') || o.includes('id card') || o.includes('lanyard') || o.includes('visiting card')) {
    return 'Business Cards';
  }
  
  if (o.includes('t-shirt') || o.includes('apparel') || o.includes('cap') || o.includes('hoodie') || o.includes('jersey') || o.includes('sweatshirt') || o.includes('polo')) {
    return 'Custom Apparel';
  }
  
  if (o.includes('packaging') || o.includes('box') || o.includes('bag') || o.includes('tape') || o.includes('label') || o.includes('sticker') || o.includes('pouch') || o.includes('envelope') || o.includes('tissue') || o.includes('mailer')) {
    return 'Packaging';
  }
  
  if (o.includes('sign') || o.includes('poster') || o.includes('banner') || o.includes('decal') || o.includes('name plate') || o.includes('standee') || o.includes('canvas') || o.includes('board')) {
    return 'Signage & Posters';
  }
  
  if (o.includes('flyer') || o.includes('brochure') || o.includes('menu') || o.includes('letterhead') || o.includes('stationery') || o.includes('document') || o.includes('folder') || o.includes('dangler') || o.includes('bill book') || o.includes('notepad') || o.includes('certificate')) {
    return 'Marketing Materials';
  }
  
  return 'Corporate Gifts';
}

for (const row of rows) {
  const data = JSON.parse(row.data);
  const oldCategory = data.subCategory || data.category || '';
  const name = data.name || '';
  
  const newCategory = mapCategory(oldCategory, name);
  
  if (data.category !== newCategory) {
    data.category = newCategory;
    db.prepare('UPDATE firestore_cache SET data = ? WHERE doc_id = ? AND collection_name = \'products\'').run(JSON.stringify(data), row.doc_id);
    c++;
  }
}

console.log('Fixed categories for', c, 'products.');
