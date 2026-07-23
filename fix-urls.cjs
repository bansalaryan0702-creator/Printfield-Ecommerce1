const Database = require('better-sqlite3');
const db = new Database('local_cache.db');

const rows = db.prepare('SELECT doc_id, data FROM firestore_cache WHERE collection_name = \'products\'').all();
let c = 0;

for (const row of rows) {
  const data = JSON.parse(row.data);
  let changed = false;
  
  if (data.image) {
    const trimmed = data.image.trim();
    const encoded = trimmed.replace(/ /g, '%20');
    if (data.image !== encoded) {
      data.image = encoded;
      changed = true;
    }
  }
  
  let imgs = data.images;
  if (typeof imgs === 'string') {
     try { imgs = JSON.parse(imgs); } catch(e) { imgs = []; }
  }
  
  if (Array.isArray(imgs)) {
    const newImgs = [];
    for (const img of imgs) {
       const trimmed = img.trim();
       const encoded = trimmed.replace(/ /g, '%20');
       newImgs.push(encoded);
       if (img !== encoded) changed = true;
    }
    if (changed) {
       data.images = JSON.stringify(newImgs);
    }
  }
  
  if (changed) {
     db.prepare('UPDATE firestore_cache SET data = ? WHERE doc_id = ? AND collection_name = \'products\'').run(JSON.stringify(data), row.doc_id);
     c++;
  }
}
console.log('Fixed spaces in URLs for', c, 'products.');
