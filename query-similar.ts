import Database from 'better-sqlite3';
const localDb = new Database('app.db');
const rows = localDb.prepare("SELECT doc_id, data FROM firestore_cache WHERE collection_name = 'users'").all();
console.log(rows.filter((r: any) => JSON.parse(r.data).email.toLowerCase().includes('bansal')));
