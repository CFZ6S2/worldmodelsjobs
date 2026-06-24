const axios = require('axios');

const JUANA_TOKEN = "shJOb5wskQMTyfoF20GLqmJOclA5if5j";

async function checkNumber(phone) {
    try {
        const response = await axios.get(`https://gate.whapi.cloud/contacts/${phone}`, {
            headers: { 'Authorization': `Bearer ${JUANA_TOKEN}` }
        });
        console.log(`Number ${phone} check result:`, response.data);
    } catch (e) {
        console.log(`Number ${phone} error:`, e.response?.status, e.response?.data);
    }
}

checkNumber('584162013551@c.us');
