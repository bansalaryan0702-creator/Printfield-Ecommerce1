const axios = require('axios');
async function run() {
  try {
    const res = await axios.get('https://printo.in/api/v1/search?q=Mug');
    console.log(res.data);
  } catch (e) {
    console.log(e.message);
  }
}
run();
