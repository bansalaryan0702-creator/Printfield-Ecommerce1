import { initializeApp } from 'firebase/app';
import { getFirestore, doc, writeBatch } from 'firebase/firestore';
import { PopularProducts } from './src/data/products';
import fs from 'fs';

// Initialize firebase using client SDK like the server does
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || '(default)');

async function seed() {
  console.log('Inserting default products to Firestore...');
  
  const batch = writeBatch(db);
  
  for (const p of PopularProducts) {
    const docRef = doc(db, 'products', p.id);
    batch.set(docRef, {
      name: p.name,
      category: p.category,
      price: p.price,
      image: p.image,
      images: p.images || [],
      description: p.description,
      features: p.features || [],
      colors: p.colors || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDisabled: false
    });
  }
  
  await batch.commit();
  console.log('✅ Default products inserted into Firestore.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
