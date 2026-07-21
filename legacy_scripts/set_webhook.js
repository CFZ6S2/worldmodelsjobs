const API_KEY = 'EvoWorldModels2026';
const BASE_URL = 'http://localhost:8082';

async function setWebhook() {
  try {
    const res = await fetch(BASE_URL + '/webhook/set/My%20data%20structure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': API_KEY },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: 'http://178.156.186.149:3001/api/evolution-webhook',
          webhookByEvents: false,
          events: ['MESSAGES_UPSERT']
        }
      })
    });
    console.log(await res.text());
  } catch(e) { console.error(e); }
}
setWebhook();
