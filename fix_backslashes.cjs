const axios = require('axios');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 'admin_script', role: 'admin' }, 'super-secret-admin-key-replace-in-prod', { expiresIn: '1h' });
const client = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    Authorization: `Bearer ${token}`
  }
});

async function run() {
  let page = 1;
  let totalFixed = 0;
  
  while(true) {
    const res = await client.get(`/api/products?page=${page}&limit=100&includeDisabled=true`);
    const prods = res.data.data || res.data;
    if (!prods || prods.length === 0) break;
    
    for (const p of prods) {
        let changed = false;
        let newImage = p.image || '';
        let newImages = p.images || [];
        
        if (newImage.endsWith('\\')) {
           newImage = newImage.substring(0, newImage.length - 1);
           changed = true;
        }
        
        let newImgList = [];
        for (let i = 0; i < newImages.length; i++) {
            if (newImages[i] && typeof newImages[i] === 'string' && newImages[i].endsWith('\\')) {
                newImgList.push(newImages[i].substring(0, newImages[i].length - 1));
                changed = true;
            } else {
                newImgList.push(newImages[i]);
            }
        }
        newImages = newImgList;
        
        if (changed) {
            console.log(`Fixing backslashes for ${p.name}`);
            await client.put(`/api/products/${p.id}`, {
              ...p,
              image: newImage,
              images: newImages
            });
            totalFixed++;
        }
    }
    
    if (prods.length < 100) break;
    page++;
  }
  console.log(`Fixed backslashes for ${totalFixed} products`);
}
run();
