import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || '(default)');

async function deleteAllProducts() {
  console.log('Deleting all products from Firestore...');
  
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);
  
  if (snapshot.empty) {
    console.log('No products found.');
    return;
  }

  const batch = writeBatch(db);
  let count = 0;
  snapshot.forEach((doc) => {
    batch.delete(doc.ref);
    count++;
  });
  
  await batch.commit();
  console.log(`✅ ${count} products deleted from Firestore.`);
  process.exit(0);
}

deleteAllProducts().catch((err) => {
  console.error(err);
  process.exit(1);
});
