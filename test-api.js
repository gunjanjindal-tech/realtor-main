// Native fetch in Node 18+

async function testApi() {
  const url = 'http://localhost:3000/api/bridge/search?limit=max';
  console.log(`Testing ${url}...`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    if (!res.ok) {
      console.error('Error Data:', data);
    } else {
      console.log('Success! Results found:', data.listings.length, 'Total reported:', data.total);
    }
  } catch (err) {
    console.error('Fetch Failed:', err.message);
  }
}

testApi();
