const API_KEY = 'EvoWorldModels2026';
const BASE_URL = 'http://localhost:8082';

async function setup() {
  try {
    console.log('Setting proxy for WorldmodelsOutput as SOCKS5...');
    const res = await fetch(BASE_URL + '/proxy/set/WorldmodelsOutput', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': API_KEY },
      body: JSON.stringify({
        enabled: true,
        host: "92.113.179.5",
        port: "45436",
        protocol: "socks5",
        username: "wVVhNsAa6foSJAN",
        password: "uMhSIT8H94x2eI5"
      })
    });
    
    if (res.ok) {
        const data = await res.json();
        console.log('✅ Proxy Set:', data);
    } else {
        const err = await res.text();
        console.error('❌ Failed to set proxy:', err);
    }
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}
setup();
