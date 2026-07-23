import fs from 'fs';
const dirs = fs.readdirSync('/proc');
for (const pid of dirs) {
  if (pid.match(/^\d+$/)) {
    try {
      const cmd = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8');
      if (cmd.includes('node') || cmd.includes('tsx')) {
        console.log(`Killing ${pid} : ${cmd}`);
        process.kill(parseInt(pid), 9);
      }
    } catch (e) {}
  }
}
