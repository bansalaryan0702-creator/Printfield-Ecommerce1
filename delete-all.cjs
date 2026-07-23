const { setDoc, doc, deleteDoc, getDocs, collection } = require('firebase/firestore');
// Actually, we don't need firebase/firestore, we can just hit the API or manipulate the sqlite db directly since it's local.
