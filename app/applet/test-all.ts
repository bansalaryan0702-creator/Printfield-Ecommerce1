import { apiFetch } from './src/lib/api';

async function test() {
  const res = await apiFetch('http://localhost:3000/');
  console.log('Is HTML?', (await res.text()).trim().startsWith('<'));
  console.log('ok:', res.ok, 'status:', res.status);
}

test().catch(console.error);
