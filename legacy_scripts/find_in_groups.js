const axios = require('axios');

const JUANA_TOKEN = "shJOb5wskQMTyfoF20GLqmJOclA5if5j";

async function findInGroups() {
    try {
        console.log("Fetching groups...");
        const response = await axios.get(`https://gate.whapi.cloud/groups?limit=100`, {
            headers: { 'Authorization': `Bearer ${JUANA_TOKEN}` }
        });
        
        const groups = response.data.groups || [];
        console.log(`Fetched ${groups.length} groups.`);
        
        for (const group of groups) {
            if (group.name && group.name.includes("HOLANDA")) {
                console.log(`Found group: ${group.name} (${group.id})`);
                const participants = group.participants || [];
                const found = participants.filter(p => String(p).includes("58416") || String(p).includes("2013551"));
                if (found.length > 0) {
                    console.log("FOUND IN GROUP HOLANDA:", found);
                }
            }
            if (group.name && group.name.includes("AMSTERDAM")) {
                console.log(`Found group: ${group.name} (${group.id})`);
                const participants = group.participants || [];
                const found = participants.filter(p => String(p).includes("58416") || String(p).includes("2013551"));
                if (found.length > 0) {
                    console.log("FOUND IN GROUP AMSTERDAM:", found);
                }
            }
        }
    } catch (e) {
        console.log("Error:", e.response?.data || e.message);
    }
}

findInGroups();
