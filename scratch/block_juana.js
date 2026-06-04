const fs = require('fs');
const path = '/root/worldmodels-jobs/whapi_gateway.js';
let code = fs.readFileSync(path, 'utf8');

// Insertar bloqueo de Juana en el procesamiento de mensajes
const filterLogic = `
                // BLOQUEO DE JUANA (SOLO SALIDA)
                const isJuana = whapiData.token === 'shJOb5wskQMTyfoF20GLqmJOclA5if5j';
                if (isJuana) {
                    // console.log("🚫 [JUANA BLOCKED] Ignorando entrada de Juana");
                    return res.end('ok');
                }
`;

if (!code.includes('BLOQUEO DE JUANA')) {
    code = code.replace('const whapiData = JSON.parse(body);', 'const whapiData = JSON.parse(body);' + filterLogic);
}

fs.writeFileSync(path, code);
