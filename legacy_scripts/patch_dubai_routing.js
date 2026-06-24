#!/usr/bin/env node
/**
 * patch_dubai_routing.js
 * Adds Dubai routing (905344119396) to the live n8n workflow
 * 
 * Run on VPS: node patch_dubai_routing.js
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
    console.error('❌ Could not fetch workflows. Response:', JSON.stringify(workflows).substring(0, 200));
    console.log('\n💡 Try setting N8N_API_KEY environment variable if authentication is required.');
    return;
  }

  const wfList = workflows.data || workflows;
  const activeWf = wfList.find(w => w.active === true);
  
  if (!activeWf) {
    console.error('❌ No active workflow found!');
    return;
  }

  console.log(`✅ Found active workflow: "${activeWf.name}" (ID: ${activeWf.id})`);
  
  // Fetch full workflow details
  const wf = await n8nRequest('GET', `/api/v1/workflows/${activeWf.id}`);
  
  let modified = false;
  
  for (const node of wf.nodes) {
    // ─── Patch Dynamic Routing Engine nodes ──────────────────
    if (node.name.startsWith('Dynamic Routing Engine') && node.parameters?.jsCode) {
      const code = node.parameters.jsCode;
      
      // Check if Dubai is already configured
      if (code.includes('dubai')) {
        console.log(`⚠️  ${node.name}: Dubai already exists, skipping.`);
        continue;
      }
      
      // Add dubai entry to the routingTable
      const dubaiBlock = `,\n  "dubai": {\n    keywords: ["dubai", "uae", "emirates", "abu dhabi", "aed", "sharjah"],\n    targets: [\n      { to: "905344119396@s.whatsapp.net", label: "DUBAI" }\n    ]\n  }`;
      
      // Find the last closing of a routing entry before the routingTable closing };
      // We insert after the monaco/last entry
      let newCode = code;
      
      // Strategy: find the pattern  }  };  (closing of last routing entry + closing of routingTable)
      // Replace the last entry's closing } before }; with } + dubaiBlock
      const routingTableEndRegex = /(\}\s*\n\s*\};)/;
      const match = newCode.match(routingTableEndRegex);
      
      if (match) {
        // Replace the first occurrence of }\n}; with } + dubai + \n};
        newCode = newCode.replace(routingTableEndRegex, `}${dubaiBlock}\n};`);
        node.parameters.jsCode = newCode;
        modified = true;
        console.log(`✅ ${node.name}: Added Dubai routing → 905344119396@s.whatsapp.net`);
      } else {
        console.log(`⚠️  ${node.name}: Could not find routingTable end pattern, trying alternative...`);
        // Alternative: look for the closing pattern with different whitespace
        const alt = newCode.replace(
          /("monaco"[\s\S]*?targets:\s*\[[\s\S]*?\]\s*\})/,
          `$1${dubaiBlock}`
        );
        if (alt !== newCode) {
          node.parameters.jsCode = alt;
          modified = true;
          console.log(`✅ ${node.name}: Added Dubai routing (alt method) → 905344119396@s.whatsapp.net`);
        } else {
          console.error(`❌ ${node.name}: Could not patch. Manual update required.`);
        }
      }
    }
    
    // ─── Patch Dynamic WhatsApp Alert nodes ──────────────────
    if (node.name.startsWith('Dynamic WhatsApp Alert') && node.parameters?.jsonBody) {
      const body = node.parameters.jsonBody;
      
      if (body.includes('ALERT DUBAI') || body.includes('isDubai')) {
        console.log(`⚠️  ${node.name}: Already has Dubai English format, skipping.`);
        continue;
      }
      
      // Replace the jsonBody with an English-aware version
      node.parameters.jsonBody = `={{ (() => {
  const isDubai = ($json.city_label || '').toUpperCase() === 'DUBAI' || ($json.target_wa || '') === '905344119396@s.whatsapp.net';
  if (isDubai) {
    return { "to": $json.target_wa, "body": "*📢 ALERT DUBAI*\\n📍 *" + ($json.city || "Dubai") + "* | 💰 *" + ($json.budget || "Negotiable") + "*\\n\\n" + ($json.text_es || "No description") + "\\n\\n👤 *Contact:* " + ($json.contact || "Unknown") + "\\n🔌 *Source:* " + ($json.platform || "WhatsApp") };
  } else {
    return { "to": $json.target_wa, "body": "*📢 ALERTA " + ($json.city_label || "GLOBAL") + "*\\n📍 *" + ($json.city || "Desconocida") + "* | 💰 *" + ($json.budget || "Negociable") + "*\\n\\n" + ($json.text_es || "Sin descripción") + "\\n\\n👤 *Remitente:* " + ($json.contact || "Desconocido") + "\\n🔌 *Fuente:* " + ($json.platform || "WhatsApp") };
  }
})() }}`;
      modified = true;
      console.log(`✅ ${node.name}: Updated with English format for Dubai leads`);
    }
  }
  
  if (!modified) {
    console.log('\n⚠️  No changes were needed. Dubai may already be configured.');
    return;
  }
  
  // Save the updated workflow
  console.log('\n💾 Saving workflow...');
  const result = await n8nRequest('PUT', `/api/v1/workflows/${activeWf.id}`, wf);
  
  if (result.id) {
    console.log(`✅ Workflow updated successfully!`);
    
    // Reactivate
    console.log('🔄 Reactivating workflow...');
    await n8nRequest('POST', `/api/v1/workflows/${activeWf.id}/activate`);
    console.log('✅ Workflow is active and routing Dubai leads to +905344119396 in English!');
  } else {
    console.error('❌ Failed to save:', JSON.stringify(result).substring(0, 300));
  }
}

main().catch(console.error);
