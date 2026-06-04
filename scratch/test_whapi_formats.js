const https = require('https');

const token = 'shJOb5wskQMTyfoF20GLqmJOclA5if5j';
const group = '120363425790792660@g.us';
const number = '34664266926';

function post(url, data) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const req = https.request(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            let resBody = '';
            res.on('data', chunk => resBody += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: resBody }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function test() {
    const formats = [
        { to: group, body: "Test 1: Group ID" },
        { to: number, body: "Test 2: Number only" },
        { to: number + '@c.us', body: "Test 3: Number @c.us" },
        { to: number + '@s.whatsapp.net', body: "Test 4: Number @s.whatsapp.net" }
    ];

    for (const f of formats) {
        console.log(`\nTesting format: ${f.to}`);
        try {
            const res = await post('https://gate.whapi.cloud/messages/text', f);
            console.log(`STATUS: ${res.status}`);
            console.log(`DATA: ${res.data}`);
        } catch (err) {
            console.error(`❌ FAILED: ${err.message}`);
        }
    }
}

test();
