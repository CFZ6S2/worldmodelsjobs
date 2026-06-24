const axios = require('axios');

const JUANA_TOKEN = "shJOb5wskQMTyfoF20GLqmJOclA5if5j";

async function searchContacts() {
    try {
        console.log("Fetching all contacts (limit 1000)...");
        const response = await axios.get(`https://gate.whapi.cloud/contacts?limit=1000`, {
            headers: { 'Authorization': `Bearer ${JUANA_TOKEN}` }
        });
        
        const contacts = response.data.contacts || [];
        console.log(`Fetched ${contacts.length} contacts.`);
        
        const found = contacts.filter(c => c.id.includes('58416') || c.id.includes('2013551'));
        if (found.length > 0) {
            console.log("FOUND CONTACTS:", JSON.stringify(found, null, 2));
        } else {
            console.log("Contact not found in address book either.");
        }
    } catch (e) {
        console.log("Error:", e.response?.data || e.message);
    }
}

searchContacts();
