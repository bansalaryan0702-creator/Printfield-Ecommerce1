import Database from 'better-sqlite3';
const localDb = new Database('app.db');
const rows = localDb.prepare("SELECT collection_name, doc_id, is_deleted FROM firestore_cache WHERE needs_sync = 1").all();
console.log('Pending Syncs:', rows.length);
