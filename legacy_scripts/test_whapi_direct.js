const axios = require('axios');

const token = 'shJOb5wskQMTyfoF20GLqmJOclA5if5j';
const target = '34658034597@s.whatsapp.net'; // Enviar a +34658034597
const url = 'https://gate.whapi.cloud/messages/text';

const data = {
    to: target,
    body: '🤖 [TEST] Hola Dolores, este es un mensaje de prueba del sistema de leads. Si recibes esto, la conexión con Whapi es correcta.'
};

axios.post(url, data, {
    headers: { 'Authorization': `Bearer ${token}` }
})
    .then(res => console.log('✅ Success:', res.status, res.data))
    .catch(err => console.error('❌ Error:', err.response?.status, err.response?.data || err.message));
