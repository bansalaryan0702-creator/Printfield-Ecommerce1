import jwt from 'jsonwebtoken';

const token = jwt.sign({ role: 'admin' }, 'super-secret-admin-key-replace-in-prod', { expiresIn: '1d' });

async function deleteAll() {
  const getRes = await fetch('http://localhost:3000/api/products?limit=1000&includeDisabled=true', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await getRes.json();
  if (!data || !data.data) {
    console.error('Failed to get products:', data);
    return;
  }
  
  const products = data.data;
  console.log(`Found ${products.length} products to delete`);
  
  for (const p of products) {
    console.log(`Deleting ${p.id}...`);
    const delRes = await fetch(`http://localhost:3000/api/products/${encodeURIComponent(p.id)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!delRes.ok) {
      console.log(`Failed to delete ${p.id}:`, await delRes.text());
    } else {
      console.log(`Deleted ${p.id}`);
    }
  }
  console.log('Done!');
}

deleteAll().catch(console.error);
