const axios = require('axios');

const JUANA_TOKEN = "shJOb5wskQMTyfoF20GLqmJOclA5if5j";

async function getParticipants() {
    try {
        const groupId = "120363421705044544@g.us";
        const response = await axios.get(`https://gate.whapi.cloud/groups/${groupId}`, {
            headers: { 'Authorization': `Bearer ${JUANA_TOKEN}` }
        });
        
        const group = response.data;
        const participants = group.participants || [];
        
        const exact = participants.find(p => p.id.startsWith("584162013551"));
        console.log("EXACT MATCH OBJECT:", JSON.stringify(exact, null, 2));
        
    } catch (e) {
        console.log("Error:", e.response?.data || e.message);
    }
}

getParticipants();
