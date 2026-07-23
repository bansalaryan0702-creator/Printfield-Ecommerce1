const https = require('https');

https.get('https://assets.mixkit.co/videos/preview/mixkit-ink-swirling-in-water-21820-large.mp4', (res) => {
  console.log('Status code:', res.statusCode);
  console.log('Headers:', res.headers['content-type']);
}).on('error', (e) => {
  console.error(e);
});
