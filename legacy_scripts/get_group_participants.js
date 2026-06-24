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
        console.log(`Group has ${participants.length} participants.`);
        
        // Find anyone with 58 or 416
        const found = participants.filter(p => p.id.includes("58") || p.id.includes("416"));
        console.log("Possible matches:", found.map(f => f.id));
        
    } catch (e) {
        console.log("Error:", e.response?.data || e.message);
    }
}

getParticipants();
