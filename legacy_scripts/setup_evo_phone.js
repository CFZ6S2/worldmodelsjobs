const API_KEY = 'EvoWorldModels2026';
const BASE_URL = 'http://localhost:8080';

async function setup() {
  try {
    console.log('Creating instance...');
    const createRes = await fetch(BASE_URL + '/instance/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': API_KEY },
      body: JSON.stringify({
        instanceName: 'AdminSession',
        token: 'EvoWorldModels2026',
        number: '573225043508',
        qrcode: false,
        integration: 'WHATSAPP-BAILEYS'
      })
    });
    const createData = await createRes.json();
    console.log('✅ Instance Created:', createData.instance?.instanceName || createData);

    console.log('Setting webhook...');
    await fetch(BASE_URL + '/webhook/set/AdminSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': API_KEY },
      body: JSON.stringify({
        enabled: true,
        url: 'http://178.156.186.149:3001/api/evolution-webhook',
        webhookByEvents: false,
        events: ['MESSAGES_UPSERT']
      })
    });

    console.log('Fetching Pairing Code...');
    const connectRes = await fetch(BASE_URL + '/instance/connect/AdminSession', {
      headers: { 'apikey': API_KEY }
    });
    const connectData = await connectRes.json();
    console.log('\n--- PAIRING CODE ---');
    console.log(connectData.pairingCode || connectData);
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}
setup();
