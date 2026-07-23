import Database from "better-sqlite3";

const db = new Database("app.db");

try {
  const stmt = db.prepare('INSERT INTO company_profiles (id, companyName, contactName, email, phone, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  stmt.run('test_id', 'Test Company', null, null, null, null, Date.now(), Date.now());
  console.log("Success!");
  const res = db.prepare('SELECT * FROM company_profiles').all();
  console.log(res);
} catch (e: any) {
  console.error("Error!!!", e.message);
}
