const Database = require('better-sqlite3');
const db = new Database('local_cache.db');
const row = db.prepare("SELECT data FROM firestore_cache WHERE collection_name = 'products' AND doc_id = '8z74b5v2a'").get();
if (row) {
  let product = JSON.parse(row.data);
  product.colors[0].mockupImage = 'https://printo-s3.dietpixels.net/site/Dry fit/Polo_1756707909.jpg';
  db.prepare("UPDATE firestore_cache SET data = ? WHERE collection_name = 'products' AND doc_id = '8z74b5v2a'").run(JSON.stringify(product));
  console.log('Updated polo mockup image to test', product.name);
}
