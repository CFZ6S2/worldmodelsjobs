const axios = require('axios');
const token = 'shJOb5wskQMTyfoF20GLqmJOclA5if5j';
const target = '120363425790792660@g.us';

axios.post('https://gate.whapi.cloud/messages/text', {
    to: target,
    body: 'TEST FROM NODE VPS SCRIPT (ROBUST)'
}, {
    headers: { 'Authorization': `Bearer ${token}` }
}).then(r => {
    console.log('SUCCESS');
    console.log(JSON.stringify(r.data, null, 2));
}).catch(e => {
    console.error('ERROR');
    console.error(e.response?.data || e.message);
});
