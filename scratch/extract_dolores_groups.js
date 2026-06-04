/**
 * Extrae TODOS los enlaces de grupo de WhatsApp de la cuenta de Dolores Fuertes
 * vía Whapi API con el token corregido.
 * 
 * V10: Super Safe Mode (count=10) due to Whapi limits.
 */
const { execSync } = require('child_process');
const fs = require('fs');

const WHAPI_TOKEN = 'cCr2pGzXM6hZgORbfo2YjdTWGRLH6eCP';

function apiRequest(path) {
    const cmd = `curl -s -H "Authorization: Bearer ${WHAPI_TOKEN}" "https://gate.whapi.cloud${path}"`;
    try {
        const output = execSync(cmd).toString();
        if (!output) return {};
        return JSON.parse(output);
    } catch(e) {
        return { error: e.message };
    }
}

async function main() {
  console.log('🚀 Iniciando extracción DOLORES V10 (Super Safe Mode)...\n');
  
  let allGroups = [];
  let offset = 0;
  let totalReported = 0;
  
  // 1. Obtener la lista de grupos usando /chats con count=10
  while (true) {
      process.stdout.write(`  📡 Listando chats (offset=${offset})... `);
      const data = apiRequest(`/chats?count=10&offset=${offset}`);
      
      const chats = data.chats || data.data || (Array.isArray(data) ? data : []);
      if (chats.length === 0) {
          console.log('\n  🏁 No más chats.');
          break;
      }
      
      totalReported = data.total || totalReported;
      const filtered = chats.filter(c => (c.id && c.id.endsWith('@g.us')) || c.type === 'group');
      allGroups = allGroups.concat(filtered);
      
      console.log(`✅ ${chats.length} leídos. (Total grupos acumulados: ${allGroups.length})`);
      
      offset += chats.length;
      if (offset >= totalReported && totalReported > 0) break;
      await new Promise(r => setTimeout(r, 500));
  }

  if (allGroups.length === 0) {
      console.log('❌ No se encontraron grupos. Abortando.');
      return;
  }

  console.log(`\n✅ Procesando ${allGroups.length} grupos para obtener enlaces...\n`);
  
  const results = [];
  for (let i = 0; i < allGroups.length; i++) {
    const g = allGroups[i];
    const groupId = g.id || g.chat_id;
    const groupName = g.name || g.subject || 'Sin nombre';
    
    process.stdout.write(`  [${i+1}/${allGroups.length}] ${groupName.substring(0, 30).padEnd(30)} `);
    
    let success = false;
    let attempts = 0;
    
    while (!success && attempts < 2) {
        attempts++;
        const invData = apiRequest(`/groups/${encodeURIComponent(groupId)}/invite`);
        
        if (invData.error && (invData.error.code === 429 || invData.status === 429)) {
            process.stdout.write(`⏳(429! 60s) `);
            await new Promise(r => setTimeout(r, 60000));
            continue; 
        }

        let link = invData.link || invData.invite_link || invData.url;
        if (!link && invData.invite_code) link = `https://chat.whatsapp.com/${invData.invite_code}`;
        
        if (link) {
            results.push({ name: groupName, link });
            console.log(`✅ ${link}`);
            success = true;
        } else if (invData.error && invData.error.code === 403) {
            console.log(`❌ 403 (No admin)`);
            success = true;
        } else {
            console.log(`❌ No link (${JSON.stringify(invData).substring(0, 40)})`);
            success = true;
        }
    }
    
    if (results.length > 0 && results.length % 5 === 0) {
        fs.writeFileSync('/tmp/enlaces_dolores.txt', results.map(r => `${r.link}\t# ${r.name}`).join('\n'));
    }
    
    await new Promise(r => setTimeout(r, 4500)); 
  }

  if (results.length > 0) {
      fs.writeFileSync('/tmp/enlaces_dolores.txt', results.map(r => `${r.link}\t# ${r.name}`).join('\n'));
      console.log(`\n✅ FINALIZADO. Guardado en /tmp/enlaces_dolores.txt`);
      console.log(`\n📄 Primeros 10 enlaces:\n`);
      results.slice(0, 10).forEach(r => console.log(r.link));
  } else {
      console.log('\n❌ No se pudo extraer ningún enlace.');
  }
}

main().catch(console.error);
