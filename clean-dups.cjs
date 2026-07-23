const Database = require('better-sqlite3');
const db = new Database('local_cache.db');
const products = db.prepare('SELECT doc_id, data FROM firestore_cache WHERE collection_name = ?').all('products');
const seen = new Set();
let deleted = 0;
for (const p of products) {
  const data = JSON.parse(p.data);
  const name = data.name;
  if (seen.has(name)) {
     db.prepare('DELETE FROM firestore_cache WHERE collection_name = ? AND doc_id = ?').run('products', p.doc_id);
     deleted++;
  } else {
     seen.add(name);
  }
}
console.log(`Deleted ${deleted} duplicate products.`);
