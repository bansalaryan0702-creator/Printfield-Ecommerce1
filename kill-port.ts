import { execSync } from 'child_process';
try {
  execSync('fuser -k 3000/tcp');
  console.log('Killed');
} catch(e: any) {
  console.log('Error', e.message);
}
