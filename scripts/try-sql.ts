async function run() {
  const url = 'https://ppfebdhulnkncvyfgyul.supabase.co';
  const secretKey = process.env.SUPABASE_SECRET_KEY || '';

  // Test SQL API endpoint or management endpoint
  try {
    const res = await fetch(`${url}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'apikey': secretKey,
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    console.log('RPC endpoint status:', res.status);
    const text = await res.text();
    console.log('RPC response:', text);
  } catch (e: any) {
    console.log('Error:', e.message);
  }
}

run();
