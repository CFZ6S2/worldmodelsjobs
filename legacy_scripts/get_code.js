const API_KEY = 'EvoWorldModels2026';
const BASE_URL = 'http://localhost:8080';

async function setup() {
  try {
    console.log('Fetching Pairing Code with + number parameter...');
    const connectRes = await fetch(BASE_URL + '/instance/connect/AdminSession?number=%2B573225043508', {
      headers: { 'apikey': API_KEY }
    });
    const connectData = await connectRes.json();
    console.log('\n--- PAIRING CODE ---');
    console.log(connectData.pairingCode);
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}
setup();
