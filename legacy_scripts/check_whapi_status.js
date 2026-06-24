const axios = require('axios');
const token = 'shJOb5wskQMTyfoF20GLqmJOclA5if5j';

async function checkWhapi() {
    try {
        console.log('--- CHECKING WHAPI HEALTH ---');
        const health = await axios.get('https://gate.whapi.cloud/health', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Health:', JSON.stringify(health.data, null, 2));

        console.log('\n--- CHECKING GROUPS ---');
        const groups = await axios.get('https://gate.whapi.cloud/groups?count=50', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Groups Count:', groups.data.groups ? groups.data.groups.length : 0);
        if (groups.data.groups) {
            groups.data.groups.forEach(g => {
                console.log(`- ${g.id}: ${g.name}`);
            });
        }

        console.log('\n--- CHECKING CHATS ---');
        const chats = await axios.get('https://gate.whapi.cloud/chats?count=50', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Chats Count:', chats.data.chats ? chats.data.chats.length : 0);
        if (chats.data.chats) {
            chats.data.chats.forEach(c => {
                console.log(`- ${c.id}: ${c.name || c.id}`);
            });
        }

    } catch (err) {
        console.error('Error checking Whapi:', err.response ? err.response.data : err.message);
    }
}

checkWhapi();
