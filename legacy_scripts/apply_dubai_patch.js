/**
 * apply_dubai_patch.js
 * Patches the exported n8n workflow JSON to add Dubai routing
 * Then writes a patched version to upload back to VPS
 */

const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'scratch', 'vps_all_workflows.json');
const outputFile = path.join(__dirname, 'scratch', 'vps_patched_workflow.json');

const workflows = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

// Find the active workflow
const activeWf = workflows.find(w => w.active === true);
if (!activeWf) {
  console.error('❌ No active workflow found!');
  process.exit(1);
}

console.log(`✅ Found active workflow: "${activeWf.name}" (ID: ${activeWf.id})`);
let modified = false;

for (const node of activeWf.nodes) {
  // ─── Patch Dynamic Routing Engine nodes ──────────────────
  if (node.name.startsWith('Dynamic Routing Engine') && node.parameters?.jsCode) {
    const code = node.parameters.jsCode;
    
    if (code.includes('"dubai"') || code.includes("'dubai'")) {
      console.log(`⚠️  ${node.name}: Dubai already exists, skipping.`);
      continue;
    }
    
    // Add dubai entry to the routingTable — insert before the closing };
    // Find the last routing entry closing pattern
    const dubaiBlock = `,\n  "dubai": {\n    keywords: ["dubai", "uae", "emirates", "abu dhabi", "aed", "sharjah"],\n    targets: [\n      { to: "905344119396@s.whatsapp.net", label: "DUBAI" }\n    ]\n  }`;
    
    let newCode = code;
    
    // Strategy: Find the routingTable end. Look for the pattern where routingTable closes: }\n};
    // Match the last entry's closing brace followed by routingTable's closing };
    const patterns = [
      // Pattern 1: }  };  (standard)
      { regex: /(\}\s*\n\};)/, replacement: (m) => `}${dubaiBlock}\n};` },
      // Pattern 2: }  }; after the last targets block
      { regex: /(targets:\s*\[\s*\{[^}]+\}\s*\]\s*\}\s*\n\};)/, replacement: (m) => m.replace(/\n\};$/, `${dubaiBlock}\n};`) },
      // Pattern 3: Simple — find "monaco" entry's closing brace and add after
      { regex: /(\"monaco\"[\s\S]*?targets:\s*\[\s*[\s\S]*?\]\s*\n\s*\})(\s*\n\};)/, replacement: (m, g1, g2) => `${g1}${dubaiBlock}${g2}` },
    ];
    
    let patched = false;
    for (const p of patterns) {
      if (p.regex.test(newCode)) {
        newCode = newCode.replace(p.regex, p.replacement);
        patched = true;
        break;
      }
    }
    
    if (!patched) {
      // Fallback: just insert before the LAST occurrence of `};` in the routingTable area
      const lastRoutingEnd = newCode.lastIndexOf('};');
      if (lastRoutingEnd > 0) {
        // Check if this is the routingTable closing
        const before = newCode.substring(lastRoutingEnd - 5, lastRoutingEnd);
        if (before.includes('}')) {
          newCode = newCode.substring(0, lastRoutingEnd) + dubaiBlock + '\n' + newCode.substring(lastRoutingEnd);
          patched = true;
        }
      }
    }
    
    if (patched) {
      node.parameters.jsCode = newCode;
      modified = true;
      console.log(`✅ ${node.name}: Added Dubai routing → 905344119396@s.whatsapp.net`);
    } else {
      console.error(`❌ ${node.name}: Could not patch automatically.`);
    }
  }
  
  // ─── Patch Dynamic WhatsApp Alert nodes ──────────────────
  if (node.name.startsWith('Dynamic WhatsApp Alert') && node.parameters?.jsonBody) {
    const body = node.parameters.jsonBody;
    
    if (body.includes('ALERT DUBAI') || body.includes('isDubai')) {
      console.log(`⚠️  ${node.name}: Already has Dubai English format, skipping.`);
      continue;
    }
    
    // Replace with English-aware version
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
  console.log('\n⚠️  No changes were needed.');
  process.exit(0);
}

// Write ONLY the active workflow (for import)
fs.writeFileSync(outputFile, JSON.stringify(activeWf, null, 2), 'utf-8');
console.log(`\n💾 Patched workflow saved to: ${outputFile}`);
console.log(`📤 Upload with: scp ${outputFile} root@178.156.186.149:/tmp/patched_wf.json`);
console.log(`🔄 Import with: docker exec n8n n8n import:workflow --input=/tmp/patched_wf.json`);
