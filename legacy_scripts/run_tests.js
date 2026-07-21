const axios = require('axios');

const webhookUrl = "http://178.156.186.149:5678/webhook/1fd718d6-49f8-43dc-a881-ff7ecf7b94ef";
const delay = ms => new Promise(r => setTimeout(r, ms));

const tests = [
  { city: 'Ibiza', text: 'Buscando chica en ibiza para evento esta noche. Presupuesto 5000' },
  { city: 'London', text: 'Looking for a girl in london for a private event. Budget 3000' },
  { city: 'Marbella', text: 'Casting urgente en marbella, evento de 3 dias, pago 8000' },
  { city: 'Monaco', text: 'Busco modelo en monaco para fiesta privada. 4000 euros' },
  { city: 'Dubai', text: 'Need a model in dubai for a boat party. Budget 6000' },
  { city: 'Russia', text: 'Casting para chicas en moscú para evento privado.' },
  { city: 'Suiza', text: 'Buscamos modelo en suiza para campaña de publicidad. Evento pagado.' }
];

async function runTests() {
  console.log('Iniciando inyeccion de leads en el Webhook de n8n...');
  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    const uniqueID = "TEST-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
    const payload = {
      text: { body: uniqueID + " " + t.text },
      author: "34658034597",
      from: "34658034597",
      chat_id: "34658034597@s.whatsapp.net",
      sender: "34658034597"
    };

    try {
      console.log(`[${i+1}/7] Enviando lead de prueba para ${t.city}...`);
      await axios.post(webhookUrl, payload);
      console.log(`  -> Webhook recibio el payload correctamente.`);
    } catch (err) {
      console.log(`  -> Error enviando webhook:`, err.message);
    }
    
    if (i < tests.length - 1) {
      console.log('  Esperando 10 segundos antes del siguiente lead para no saturar n8n...');
      await delay(10000); // 10 seconds between inputs
    }
  }
  console.log('¡Todos los leads inyectados en n8n! El backend ira enviandolos progresivamente.');
}

runTests();
