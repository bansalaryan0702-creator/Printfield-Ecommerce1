const Database = require('better-sqlite3');
const db = new Database('local_cache.db');
const result = db.prepare('DELETE FROM products').run();
console.log(`Deleted ${result.changes} products.`);
