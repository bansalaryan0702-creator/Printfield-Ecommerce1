import jwt from 'jsonwebtoken';

const JWT_SECRET = 'super-secret-admin-key-replace-in-prod';
const token = jwt.sign({ id: 'admin', email: 'admin', role: 'admin' }, JWT_SECRET);
console.log(token);
