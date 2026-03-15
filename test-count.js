
const fetch = require('node-fetch');

async function testCount() {
  const url = 'http://localhost:3000/api/bridge/search?countOnly=true&city=Halifax';
  console.log('Testing countOnly API:', url);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    if (data.total !== undefined && data.listings.length === 0) {
      console.log('✅ Success: countOnly returned total and 0 listings.');
    } else {
      console.log('❌ Failure: countOnly response unexpected.');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testCount();
