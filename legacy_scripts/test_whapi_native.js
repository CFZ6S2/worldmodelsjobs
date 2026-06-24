const https = require('https');
const token = 'shJOb5wskQMTyfoF20GLqmJOclA5if5j';
const target = '120363425790792660@g.us';

const data = JSON.stringify({
    to: target,
    body: 'TEST FROM NODE VPS (HTTPS MODULE)'
});

const options = {
    hostname: 'gate.whapi.cloud',
    path: '/messages/text',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => { responseBody += chunk; });
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('BODY:', responseBody);
    });
});

req.on('error', (e) => {
    console.error('ERROR:', e.message);
});

req.write(data);
req.end();
