const API_KEY = 'EvoWorldModels2026';
const BASE_URL = 'http://localhost:8080';

async function setup() {
  try {
    const instanceName = 'AdminSession_' + Date.now();
    console.log('Creating fresh instance:', instanceName);
    const createRes = await fetch(BASE_URL + '/instance/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': API_KEY },
      body: JSON.stringify({
        instanceName: instanceName,
        token: 'EvoWorldModels2026',
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      })
    });
    const createData = await createRes.json();
    console.log('✅ Instance Created:', createData.instance?.instanceName || createData);

    console.log('Setting webhook...');
    await fetch(BASE_URL + '/webhook/set/' + instanceName, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': API_KEY },
      body: JSON.stringify({
        enabled: true,
        url: 'http://178.156.186.149:3001/api/evolution-webhook',
        webhookByEvents: false,
        events: ['MESSAGES_UPSERT']
      })
    });

    console.log('Fetching QR...');
    const qrRes = await fetch(BASE_URL + '/instance/connect/' + instanceName, {
      headers: { 'apikey': API_KEY }
    });
    const qrData = await qrRes.json();
    console.log('\n--- SCAN THIS QR CODE IN WHATSAPP ---');
    console.log(qrData.base64 || qrData);
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}
setup();
