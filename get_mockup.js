const https = require('https');
https.get('https://api.github.com/search/repositories?q=polo+mockup', {headers: {'User-Agent': 'node.js'}}, (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => console.log(data));
});
