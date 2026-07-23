const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function test() {
  const form = new FormData();
  form.append('file', fs.createReadStream('package.json')); // Using package.json as dummy file
  try {
    const res = await axios.post('http://localhost:3000/api/upload', form, {
      headers: { ...form.getHeaders() }
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.log("Error:", err.response ? err.response.data : err.message);
  }
}
test();
