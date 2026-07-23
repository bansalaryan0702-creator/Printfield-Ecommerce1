import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import * as fsSync from 'fs';
import path from 'path';

let firebaseConfig = {};
if (fsSync.existsSync(path.join(process.cwd(), 'firebase-applet-config.json'))) {
  firebaseConfig = JSON.parse(fsSync.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
}
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = initializeFirestore(firebaseApp, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log("Fetching products...");
  const snap = await getDocs(collection(firestoreDb, 'products'));
  const products = snap.docs.map(d => ({id: d.id, ...d.data()}));
  console.log(`Found ${products.length} products`);
  
  for (const p of products) {
    if (p.image && typeof p.image === 'string' && p.image.startsWith('http')) {
      console.log(`Product ${p.id}: ${p.name} - Image: ${p.image}`);
    }
  }
  console.log("Done");
}
run();
