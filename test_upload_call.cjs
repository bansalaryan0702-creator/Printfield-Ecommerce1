const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function testUpload() {
  const form = new FormData();
  form.append('file', fs.createReadStream('package.json')); // just dummy text file
  
  try {
    const res = await axios.post('http://localhost:3000/api/upload', form, {
      headers: {
        ...form.getHeaders()
      }
    });
    console.log(res.data);
  } catch (e) {
    console.log(e.response ? e.response.data : e.message);
  }
}
testUpload();
