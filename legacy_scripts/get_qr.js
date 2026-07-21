fetch('http://localhost:8080/instance/connect/AdminSession', { headers: { apikey: 'EvoWorldModels2026' } }).then(function(r){return r.json()}).then(function(d){console.log(d.base64)});
