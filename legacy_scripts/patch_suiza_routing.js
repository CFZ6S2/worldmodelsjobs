#!/usr/bin/env node

const http = require('http');

const N8N_HOST = '127.0.0.1';
const N8N_PORT = 5678;
const N8N_API_KEY = process.env.N8N_API_KEY || '';

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

async function main() {
  console.log('🔍 Fetching active workflows...');
  const workflows = await n8nRequest('GET', '/api/v1/workflows');
  
  const wfList = workflows.data || workflows;
  if (!Array.isArray(wfList)) {
    console.error('❌ Could not fetch workflows. Authentication needed?');
    return;
  }
  const activeWf = wfList.find(w => w.active === true);
  if (!activeWf) {
    console.error('❌ No active workflow found!');
    return;
  }
  console.log(`✅ Found active workflow: "${activeWf.name}" (ID: ${activeWf.id})`);
  const wf = await n8nRequest('GET', `/api/v1/workflows/${activeWf.id}`);
  
  let modified = false;
  
  for (const node of wf.nodes) {
    if (node.name.startsWith('Dynamic Routing Engine') && node.parameters?.jsCode) {
      const code = node.parameters.jsCode;
      
      if (code.includes('suiza')) {
        console.log(`⚠️  ${node.name}: Suiza already exists, skipping.`);
        continue;
      }
      
      const suizaBlock = `,\n  "suiza": {\n    keywords: ["suiza", "switzerland", "zurich", "ginebra", "basilea", "berna", "lausana", "lugano", "lucerna", "schweiz", "suisse", "svizzera"],\n    targets: [\n      { to: "573183836809@s.whatsapp.net", label: "SUIZA" }\n    ]\n  }`;
      
      const routingTableEndRegex = /(\}\\s*\\n\\s*\\};)/;
      const match = code.match(routingTableEndRegex);
      
      if (match) {
        node.parameters.jsCode = code.replace(routingTableEndRegex, `}${suizaBlock}\n};`);
        modified = true;
        console.log(`✅ ${node.name}: Added Suiza routing → 573183836809@s.whatsapp.net`);
      } else {
        const altRegex = /("monaco"[\\s\\S]*?targets:\\s*\\[[\\s\\S]*?\\]\\s*\\})/;
        const altMatch = code.match(altRegex);
        if (altMatch) {
            node.parameters.jsCode = code.replace(altRegex, `$1${suizaBlock}`);
            modified = true;
            console.log(`✅ ${node.name}: Added Suiza routing (alt method) → 573183836809@s.whatsapp.net`);
        } else {
            console.error(`❌ ${node.name}: Could not find routingTable end pattern.`);
            // fallback
            const lastBraceRegex = /(.*\\})([\\s]*\\};)$/s;
            const lastMatch = code.match(lastBraceRegex);
            if (lastMatch) {
                node.parameters.jsCode = code.replace(lastBraceRegex, `$1${suizaBlock}$2`);
                modified = true;
                console.log(`✅ ${node.name}: Added Suiza routing (fallback method) → 573183836809@s.whatsapp.net`);
            }
        }
      }
    }
  }
  
  if (!modified) {
    console.log('\\n⚠️  No changes were needed. Suiza may already be configured.');
    return;
  }
  
  console.log('\\n💾 Saving workflow...');
  const result = await n8nRequest('PUT', `/api/v1/workflows/${activeWf.id}`, wf);
  if (result.id) {
    console.log(`✅ Workflow updated successfully!`);
    console.log('🔄 Reactivating workflow...');
    await n8nRequest('POST', `/api/v1/workflows/${activeWf.id}/activate`);
    console.log('✅ Workflow is active and routing Suiza leads to +573183836809');
  } else {
    console.error('❌ Failed to save:', JSON.stringify(result).substring(0, 300));
  }
}

main().catch(console.error);
