const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const token = jwt.sign({ id: 'admin_script', role: 'admin' }, 'super-secret-admin-key-replace-in-prod', { expiresIn: '1h' });
const client = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    Authorization: `Bearer ${token}`
  }
});

let rec1 = {};
try { rec1 = JSON.parse(fs.readFileSync('recovered_images.json', 'utf8')); } catch(e){}

let rec2 = {};
try { rec2 = JSON.parse(fs.readFileSync('recovered_all.json', 'utf8')); } catch(e){}

async function run() {
  let page = 1;
  let totalRestored = 0;
  
  while(true) {
    const res = await client.get(`/api/products?page=${page}&limit=100&includeDisabled=true`);
    const prods = res.data.data || res.data;
    if (!prods || prods.length === 0) break;
    
    for (const p of prods) {
        let changed = false;
        let newImage = p.image || '';
        let newImages = p.images || [];
        
        // Find if we have a recovered image
        if (!newImage || !newImage.startsWith('http') || newImage.includes('placehold.co')) {
           const rec1Img = rec1[p.name];
           if (rec1Img && typeof rec1Img === 'string' && rec1Img.startsWith('http')) {
              newImage = rec1Img;
              changed = true;
           } else {
              const rec2Obj = rec2[p.name];
              if (rec2Obj && rec2Obj.image && rec2Obj.image.startsWith('http')) {
                 newImage = rec2Obj.image;
                 changed = true;
                 if (rec2Obj.images && rec2Obj.images.length > 0) {
                     newImages = rec2Obj.images;
                 }
              }
           }
        }
        
        if (changed) {
            console.log(`Restoring images for ${p.name}`);
            await client.put(`/api/products/${p.id}`, {
              ...p,
              image: newImage,
              images: newImages,
              isDisabled: false // enable if we have image
            });
            totalRestored++;
        }
    }
    
    if (prods.length < 100) break;
    page++;
  }
  console.log(`Restored images for ${totalRestored} products`);
}
run();
