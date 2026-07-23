import jwt from 'jsonwebtoken';

const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'super-secret-key-change-in-production', { expiresIn: '1d' });

fetch('http://localhost:3000/api/products/test1', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(res => res.text()).then(console.log).catch(console.error);
