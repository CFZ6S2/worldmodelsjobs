const axios = require('axios');

const url = 'http://178.156.186.149:5678/webhook/1fd718d6-49f8-43dc-a881-ff7ecf7b94ef';
const data = {
    platform: 'whatsApp',
    from: '34600000000',
    sender: '34600000000',
    chatId: '34600000000',
    body: { text: 'Buscando chicas para evento en Ibiza hoy, paga 2000 euros. Interesadas al privado.' },
    text: 'Buscando chicas para evento en Ibiza hoy, paga 2000 euros. Interesadas al privado.',
    source: 'manual_test'
};

axios.post(url, data)
    .then(res => console.log('✅ Success:', res.status, res.data))
    .catch(err => console.error('❌ Error:', err.response?.status, err.response?.data || err.message));
