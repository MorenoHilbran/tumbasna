async function testApi() {
  const res = await fetch('http://localhost:3000/api/dashboard');
  const data = await res.json();
  console.log('✅ REGION STATS FROM LIVE API:');
  console.log(JSON.stringify(data.data.regionStats, null, 2));
}

testApi();
