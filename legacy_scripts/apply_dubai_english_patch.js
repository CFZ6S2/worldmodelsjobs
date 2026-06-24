/**
 * apply_dubai_english_patch.js
 * Patches the exported n8n workflow JSON to:
 * 1. Make the AI extract text_en and title_en
 * 2. Update the Dubai alert body to use text_en and title_en
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
  // ─── 1. Patch IA Extract nodes ──────────────────
  if (node.name.startsWith('IA Extract') && node.parameters?.text) {
    let prompt = node.parameters.text;
    
    // Add text_en and title_en to JSON SCHEMA if not present
    if (!prompt.includes('"text_en"')) {
      prompt = prompt.replace(
        /"title_es": "Short descriptive title",\n  "text_es": "Clean and translated text",/g,
        '"title_es": "Short descriptive title in Spanish",\n  "text_es": "Clean and translated text in Spanish",\n  "title_en": "Short descriptive title in English",\n  "text_en": "Clean and translated text in English",'
      );
      node.parameters.text = prompt;
      modified = true;
      console.log(`✅ ${node.name}: Prompt updated to include text_en & title_en`);
    }
  }

  // ─── 2. Patch Parse JSON nodes to pass through text_en ──────────────────
  if (node.name.startsWith('Parse JSON') && node.parameters?.jsCode) {
    let code = node.parameters.jsCode;
    
    if (!code.includes('text_en')) {
      // Add extraction of text_en and title_en
      let newCode = code;
      // In the finalData object creation:
      // text_es: parsed.text_es ...
      // title_es: parsed.title_es ...
      const replaceRegex = /(text_es:[^,\n]+,)/;
      newCode = newCode.replace(replaceRegex, `$1\n  text_en: parsed.text_en || "",\n  title_en: parsed.title_en || "",`);
      
      if (newCode !== code) {
        node.parameters.jsCode = newCode;
        modified = true;
        console.log(`✅ ${node.name}: Added text_en passthrough`);
      }
    }
  }

  // ─── 3. Patch Dynamic WhatsApp Alert nodes ──────────────────
  if (node.name.startsWith('Dynamic WhatsApp Alert') && node.parameters?.jsonBody) {
    let body = node.parameters.jsonBody;
    
    // We update the isDubai branch to use text_en and title_en
    if (body.includes('isDubai')) {
      const newBody = `={{ (() => {
  const isDubai = ($json.city_label || '').toUpperCase() === 'DUBAI' || ($json.target_wa || '') === '905344119396@s.whatsapp.net';
  if (isDubai) {
    // Usamos las variables en inglés generadas por la IA
    const title = $json.title_en || $json.title_es || "New Lead";
    const text = $json.text_en || $json.text_es || "No description";
    return { "to": $json.target_wa, "body": "*📢 ALERT DUBAI*\\n📍 *" + ($json.city || "Dubai") + "* | 💰 *" + ($json.budget || "Negotiable") + "*\\n\\n" + text + "\\n\\n👤 *Contact:* " + ($json.contact || "Unknown") + "\\n🔌 *Source:* " + ($json.platform || "WhatsApp") };
  } else {
    return { "to": $json.target_wa, "body": "*📢 ALERTA " + ($json.city_label || "GLOBAL") + "*\\n📍 *" + ($json.city || "Desconocida") + "* | 💰 *" + ($json.budget || "Negociable") + "*\\n\\n" + ($json.text_es || "Sin descripción") + "\\n\\n👤 *Remitente:* " + ($json.contact || "Desconocido") + "\\n🔌 *Fuente:* " + ($json.platform || "WhatsApp") };
  }
})() }}`;
      
      if (body !== newBody) {
        node.parameters.jsonBody = newBody;
        modified = true;
        console.log(`✅ ${node.name}: Updated with actual ENGLISH fields (text_en/title_en)`);
      }
    }
  }
  
  // Also ensure the routing table has Dubai just in case
  if (node.name.startsWith('Dynamic Routing Engine') && node.parameters?.jsCode) {
    const code = node.parameters.jsCode;
    const dubaiBlock = `,\n  "dubai": {\n    keywords: ["dubai", "uae", "emirates", "abu dhabi", "aed", "sharjah"],\n    targets: [\n      { to: "905344119396@s.whatsapp.net", label: "DUBAI" }\n    ]\n  }`;
    if (!code.includes('"dubai"')) {
      let newCode = code.replace(/(\}\s*\n\};)/, `}${dubaiBlock}\n};`);
      if (newCode !== code) {
         node.parameters.jsCode = newCode;
         modified = true;
      }
    }
  }
}

if (!modified) {
  console.log('\n⚠️  No changes were needed.');
  process.exit(0);
}

// Write ONLY the active workflow (for import)
fs.writeFileSync(outputFile, JSON.stringify(activeWf, null, 2), 'utf-8');
console.log(`\n💾 Patched workflow saved to: ${outputFile}`);
