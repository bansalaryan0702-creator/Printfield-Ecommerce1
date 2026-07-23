import https from 'https';

const urls = [
  'https://images.unsplash.com/photo-1620078713175-5775c75bf693',
  'https://images.unsplash.com/photo-1544474718-2e06c9a3411e',
  'https://images.unsplash.com/photo-1606775618458-71e8c95aebd7',
  'https://images.unsplash.com/photo-1587582423116-ec07293f0395',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe'
];

urls.forEach(url => {
  https.get(url, (res) => {
    console.log(url, res.statusCode);
  });
});
