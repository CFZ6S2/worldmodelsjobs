const axios = require('axios');

const JUANA_TOKEN = "shJOb5wskQMTyfoF20GLqmJOclA5if5j";

async function getChats() {
    try {
        const response = await axios.get(`https://gate.whapi.cloud/chats?limit=10`, {
            headers: { 'Authorization': `Bearer ${JUANA_TOKEN}` }
        });
        
        const chats = response.data.chats || [];
        chats.forEach(chat => {
            console.log(`Chat ID: ${chat.id}, Name: ${chat.name}`);
            if (chat.id.includes('58416') || chat.id.includes('2013551')) {
                console.log("MATCH FOUND:", JSON.stringify(chat, null, 2));
            }
        });
    } catch (e) {
        console.log("Error:", e.response?.data || e.message);
    }
}

getChats();
