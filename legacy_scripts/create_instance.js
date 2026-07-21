const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 8082,
  path: '/instance/create',
  method: 'POST',
  headers: {
    'apikey': 'EvoWorldModels2026',
    'Content-Type': 'application/json'
  }
}, res => {
  let d = '';
  res.on('data', chunk => d+=chunk);
  res.on('end', () => console.log(d));
});

req.write(JSON.stringify({
  instanceName: 'My data structure',
  qrcode: true,
  integration: 'WHATSAPP-BAILEYS'
}));
req.end();
