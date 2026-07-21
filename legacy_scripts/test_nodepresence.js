const axios = require('axios');
axios.post('http://localhost:8082/message/sendText/WorldmodelsOutput', {
    number: '34658034597',
    textMessage: { text: 'Test sin presence' }
}, {
    headers: { apikey: 'EvoWorldModels2026' }
}).then(r => console.log('✅ Enviado:', r.data))
  .catch(e => console.log('❌ Error:', e.message));
