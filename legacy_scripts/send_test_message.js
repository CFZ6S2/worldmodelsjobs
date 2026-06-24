const axios = require('axios');

const JUANA_TOKEN = "shJOb5wskQMTyfoF20GLqmJOclA5if5j";

async function sendMessage() {
    try {
        const response = await axios.post('https://gate.whapi.cloud/messages/text', {
            to: "584162013551@s.whatsapp.net",
            body: "Prueba técnica de sistema (ignorar)"
        }, {
            headers: { 'Authorization': `Bearer ${JUANA_TOKEN}` }
        });
        console.log("Success:", response.data);
    } catch (e) {
        console.log("Error status:", e.response?.status);
        console.log("Error data:", JSON.stringify(e.response?.data, null, 2));
    }
}

sendMessage();
