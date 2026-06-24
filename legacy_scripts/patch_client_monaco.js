#!/usr/bin/env node
/**
 * patch_client_monaco.js
 * Configures the bot for the Monaco/Cannes/Nice client.
 * Routes leads to:
 * - WhatsApp: +5511953600828
 * - Telegram: 5479166354
 * 
 * Run on VPS: node patch_client_monaco.js
 */

const http = require('http');

const N8N_HOST = '127.0.0.1';
const N8N_PORT = 5678;
const N8N_API_KEY = process.env.N8N_API_KEY || '';

// ─── Helpers ─────────────────────────────────────────────────
function n8nRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: N8N_HOST,
      port: N8N_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_API_KEY ? { 'X-N8N-API-KEY': N8N_API_KEY } : {}),
      },
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = http.request(options, (res) => {
      let chunks = '';
      res.on('data', (c) => (chunks += c));
      res.on('end', () => {
        try { resolve(JSON.parse(chunks)); } catch { resolve(chunks); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Fetching active workflows...');
  const workflows = await n8nRequest('GET', '/api/v1/workflows');
  
  if (!workflows.data && !Array.isArray(workflows)) {
    console.error('❌ Could not fetch workflows. Ensure n8n is running and N8N_API_KEY is set if required.');
    return;
  }

  const wfList = workflows.data || workflows;
  const activeWf = wfList.find(w => w.active === true);
  
  if (!activeWf) {
    console.error('❌ No active workflow found!');
    return;
  }

  console.log(`✅ Found active workflow: "${activeWf.name}" (ID: ${activeWf.id})`);
  const wf = await n8nRequest('GET', `/api/v1/workflows/${activeWf.id}`);
  
  let modified = false;
  
  for (const node of wf.nodes) {
    // ─── Patch Dynamic Routing Engine (WhatsApp) ──────────────────
    if (node.name.startsWith('Dynamic Routing Engine') && node.parameters?.jsCode) {
      let code = node.parameters.jsCode;
      
      if (code.includes('5511953600828@s.whatsapp.net')) {
        console.log(`⚠️  ${node.name}: Monaco WA client already exists, skipping.`);
      } else {
        const monacoBlock = `,\n  "costa_azul": {\n    keywords: ["monaco", "cannes", "niza", "nice", "monte carlo", "côte d'azur"],\n    targets: [\n      { to: "5511953600828@s.whatsapp.net", label: "COSTA AZUL" }\n    ]\n  }`;
        
        const routingTableEndRegex = /(\}\s*\n\s*\};)/;
        if (code.match(routingTableEndRegex)) {
          code = code.replace(routingTableEndRegex, `}${monacoBlock}\n};`);
          node.parameters.jsCode = code;
          modified = true;
          console.log(`✅ ${node.name}: Added Costa Azul routing → 5511953600828@s.whatsapp.net`);
        } else {
          console.error(`❌ ${node.name}: Could not find routingTable end pattern.`);
        }
      }
    }
    
    // ─── Patch Telegram Prepare Fanout (Telegram) ──────────────────
    if (node.name.startsWith('Telegram Prepare Fanout') && node.parameters?.jsCode) {
      let code = node.parameters.jsCode;
      
      if (code.includes('5479166354')) {
        console.log(`⚠️  ${node.name}: Monaco TG client already exists, skipping.`);
      } else {
        // We inject the routing logic right before the 'return languages.map' line
        const tgInject = `
// --- INJECTED: COSTA AZUL CLIENT (PORTUGUESE) ---
const cityRaw = String(item.city || 'Global').toLowerCase();
const textRaw = String(item.text_es || '').toLowerCase();
const monacoKws = ["monaco", "cannes", "niza", "nice", "monte carlo", "côte d'azur"];
if (monacoKws.some(kw => cityRaw.includes(kw) || textRaw.includes(kw))) {
  languages.push({ id: '5479166354', title: item.title_pt || item.title_es, text: item.text_pt || item.text_es, label: 'Remetente' });
}
// -----------------------------------
`;
        const returnStr = 'return languages.map';
        if (code.includes(returnStr)) {
          code = code.replace(returnStr, tgInject + '\n' + returnStr);
          node.parameters.jsCode = code;
          modified = true;
          console.log(`✅ ${node.name}: Added Costa Azul routing → TG: 5479166354 (PT)`);
        } else {
          console.error(`❌ ${node.name}: Could not find 'return languages.map' to inject TG logic.`);
        }
      }
    }
    
    // ─── Patch Dynamic WhatsApp Alert (Language Routing) ──────────────────
    if (node.name.startsWith('Dynamic WhatsApp Alert') && node.parameters?.jsonBody) {
      const body = node.parameters.jsonBody;
      
      if (body.includes('ALERTA COSTA AZUL') || body.includes('isCostaAzul')) {
        console.log(`⚠️  ${node.name}: Monaco WA language format already exists, skipping.`);
      } else {
        node.parameters.jsonBody = `={{ (() => {
  const target = $json.target_wa || '';
  const label = ($json.city_label || '').toUpperCase();
  
  if (label === 'DUBAI' || target === '905344119396@s.whatsapp.net') {
    return { "to": target, "body": "*📢 ALERT DUBAI*\\n📍 *" + ($json.city || "Dubai") + "* | 💰 *" + ($json.budget || "Negotiable") + "*\\n\\n" + ($json.text_en || $json.text_es || "No description") + "\\n\\n👤 *Contact:* " + ($json.contact || "Unknown") + "\\n🔌 *Source:* " + ($json.platform || "WhatsApp") };
  } 
  else if (label === 'COSTA AZUL' || target === '5511953600828@s.whatsapp.net') {
    return { "to": target, "body": "*📢 ALERTA COSTA AZUL*\\n📍 *" + ($json.city || "Desconhecida") + "* | 💰 *" + ($json.budget || "Negociável") + "*\\n\\n" + ($json.text_pt || $json.text_es || "Sem descrição") + "\\n\\n👤 *Remetente:* " + ($json.contact || "Desconhecido") + "\\n🔌 *Fonte:* " + ($json.platform || "WhatsApp") };
  }
  else {
    return { "to": target, "body": "*📢 ALERTA " + (label || "GLOBAL") + "*\\n📍 *" + ($json.city || "Desconocida") + "* | 💰 *" + ($json.budget || "Negociable") + "*\\n\\n" + ($json.text_es || "Sin descripción") + "\\n\\n👤 *Remitente:* " + ($json.contact || "Desconocido") + "\\n🔌 *Fuente:* " + ($json.platform || "WhatsApp") };
  }
})() }}`;
        modified = true;
        console.log(`✅ ${node.name}: Updated with Portuguese format for Costa Azul leads`);
      }
    }
  }
  
  if (!modified) {
    console.log('\n⚠️  No changes were needed. Client may already be configured.');
    return;
  }
  
  console.log('\n💾 Saving workflow...');
  const result = await n8nRequest('PUT', `/api/v1/workflows/${activeWf.id}`, wf);
  
  if (result.id) {
    console.log(`✅ Workflow updated successfully!`);
    console.log('🔄 Reactivating workflow...');
    await n8nRequest('POST', `/api/v1/workflows/${activeWf.id}/activate`);
    console.log('✅ Workflow is active and routing Costa Azul leads to WA and TG!');
  } else {
    console.error('❌ Failed to save:', JSON.stringify(result).substring(0, 300));
  }
}

main().catch(console.error);
