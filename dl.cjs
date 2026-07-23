const fs = require('fs');
const https = require('https');

async function downloadDriveImage() {
  const url = 'https://drive.google.com/uc?export=download&id=1HHWk1I3eK_xAsJZS0Qpw8p1k1W323J09';
  
  try {
    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok) throw new Error('Network response was not ok');
    const buffer = await response.arrayBuffer();
    fs.writeFileSync('src/assets/logo.png', Buffer.from(buffer));
    console.log('Downloaded file size:', buffer.byteLength);
  } catch (error) {
    console.error('Download failed:', error);
  }
}

downloadDriveImage();
