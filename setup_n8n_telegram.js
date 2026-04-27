const { execSync } = require('child_process');
const fs = require('fs');

// 1. Insertar el workflow en n8n via la API REST (necesita reinicio de n8n para activar webhook)
// Usaremos sqlite3 directamente

const workflowJson = {
  name: "Telegram Leads - WorldModels",
  nodes: [
    {
      parameters: {
        httpMethod: "POST",
        path: "telegram-leads",
        responseMode: "responseNode",
        options: {}
      },
      id: "webhook-tg-1",
      name: "Webhook Telegram",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [240, 300],
      webhookId: "a1b2c3d4-e5f6-7890-abcd-telegram1234"
    },
    {
      parameters: {
        jsCode: `const body = $input.first().json.body || $input.first().json;
const platform = 'telegram';
const from = body.from || body.sender_contact || body.contact || '-';
const text = body.text || (body.body && body.body.text) || '-';
const chatId = body.chatId || body.remoteJid || '-';
const pushName = body.pushName || body.from_name || '';
return [{json: {platform, from, sender: from, contact: from, whatsapp: from, chatId, remoteJid: chatId + '@g.us', isGroup: true, text, pushName, timestamp: new Date().toISOString(), source: 'telegram_n8n'}}];`
      },
      id: "map-fields-1",
      name: "Mapear Campos Telegram",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [460, 300]
    },
    {
      parameters: {
        method: "POST",
        url: "http://178.156.186.149:3001/api/leads",
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ $json }}",
        options: {}
      },
      id: "post-backend-1",
      name: "Enviar al Backend",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [680, 300]
    },
    {
      parameters: {
        respondWith: "json",
        responseBody: "={{ JSON.stringify({ success: true }) }}"
      },
      id: "respond-1",
      name: "Responder OK",
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1.1,
      position: [900, 300]
    }
  ],
  connections: {
    "Webhook Telegram": { main: [[{ node: "Mapear Campos Telegram", type: "main", index: 0 }]] },
    "Mapear Campos Telegram": { main: [[{ node: "Enviar al Backend", type: "main", index: 0 }]] },
    "Enviar al Backend": { main: [[{ node: "Responder OK", type: "main", index: 0 }]] }
  },
  active: true,
  settings: { executionOrder: "v1" }
};

const workflowStr = JSON.stringify(workflowJson).replace(/'/g, "''");
const now = new Date().toISOString().replace('T', ' ').replace(/\..+/, '');

// Insert into SQLite
const insertSQL = `INSERT OR REPLACE INTO workflow_entity (name, active, nodes, connections, settings, createdAt, updatedAt, versionId) VALUES ('${workflowJson.name}', 1, '${JSON.stringify(workflowJson.nodes).replace(/'/g, "''")}', '${JSON.stringify(workflowJson.connections).replace(/'/g, "''")}', '{"executionOrder":"v1"}', '${now}', '${now}', 'tg-leads-v1');`;

fs.writeFileSync('/tmp/insert_wf.sql', insertSQL);
try {
  execSync('sqlite3 /root/.n8n/database.sqlite < /tmp/insert_wf.sql');
  console.log('Workflow inserted into n8n database!');
} catch(e) {
  console.log('DB insert failed:', e.message);
}

// 2. Update sniffer to use n8n webhook
const snifferPath = '/root/worldmodels-jobs/telegram_sniffer/sniffer.js';
let sniffer = fs.readFileSync(snifferPath, 'utf8');

// Replace BACKEND_URL with N8N_URL
sniffer = sniffer.replace(
  "const BACKEND_URL = 'http://178.156.186.149:3001/api/leads';",
  "const N8N_WEBHOOK_URL = 'http://178.156.186.149:5678/webhook/telegram-leads';"
);
sniffer = sniffer.replace(
  /const res = await fetch\(BACKEND_URL,/g,
  "const res = await fetch(N8N_WEBHOOK_URL,"
);
sniffer = sniffer.replace(
  /headers: \{ 'Content-Type': 'application\/json', 'x-api-key': 'worldmodels-secret-2024' \}/g,
  "headers: { 'Content-Type': 'application/json' }"
);
sniffer = sniffer.replace(
  /console\.log\('Sent to BACKEND:/g,
  "console.log('Sent to N8N:"
);

fs.writeFileSync(snifferPath, sniffer);
console.log('Sniffer updated to use n8n webhook!');

console.log('\nDone! Now run: pm2 restart tg-sniffer');
console.log('And restart n8n to activate the new webhook.');
