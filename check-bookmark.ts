import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

async function checkBookmarks() {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const app = initializeApp(firebaseConfig);
    const db = initializeFirestore(app, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId || 'ai-studio-84a659f4-d467-4e09-88a5-5dfb369ca41e');

    const productsRef = collection(db, 'products');
    const qs = await getDocs(productsRef);

    for (const d of qs.docs) {
      const data = d.data();
      if (data.name && data.name.toLowerCase().includes('bookmark')) {
        console.log('Bookmark product:', data.name);
        console.log('Main image:', data.image);
        console.log('Images:', data.images);
      }
    }
  } catch (err: any) {
    console.error(err);
  }
}

checkBookmarks();
