import Database from 'better-sqlite3';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'app.db');

async function seed() {
  const db = new Database(DB_FILE);

  const stmt = db.prepare('INSERT INTO products (id, name, category, price, image, images, description, features, colors, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  
  console.log('Inserting 3000 dummy products...');
  
  const insertMany = db.transaction(() => {
    for (let i = 0; i < 3000; i++) {
      const id = `dummy-${Math.random().toString(36).substr(2, 9)}`;
      const images = JSON.stringify([
        'https://via.placeholder.com/600/0000FF/808080?text=Img1',
        'https://via.placeholder.com/600/FF0000/FFFFFF?text=Img2',
        'https://via.placeholder.com/600/FFFF00/000000?text=Img3',
        'https://via.placeholder.com/600/000000/FFFFFF?text=Img4'
      ]);
      const features = JSON.stringify(['Feature 1', 'Feature 2']);
      const colors = JSON.stringify([]);
      
      stmt.run(
        id,
        `Dummy Product ${i + 1}`,
        'Apparel',
        Math.floor(Math.random() * 1000) + 100,
        'https://via.placeholder.com/600/0000FF/808080?text=Main',
        images,
        'This is a dummy product generated for scale testing.',
        features,
        colors,
        Date.now() - i * 1000,
        Date.now()
      );
    }
  });
  
  insertMany();
  
  console.log('✅ 3000 products inserted.');
}

seed().catch(console.error);
