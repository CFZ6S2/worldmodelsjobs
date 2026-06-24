const fs = require('fs'); 
const file = './scratch/vps_patched_workflow.json'; 
const wf = JSON.parse(fs.readFileSync(file)); 

wf.nodes.forEach(n => { 
  if(n.name.startsWith('Dynamic WhatsApp Alert')) { 
    n.parameters.jsonBody = `={{ (() => { 
  const isDubai = ($json.city_label || '').toUpperCase() === 'DUBAI' || ($json.target_wa || '') === '905344119396@s.whatsapp.net'; 
  if (isDubai) { 
    const title = $json.title_en || $json.title_es || 'New Lead'; 
    const text = $json.text_en || $json.text_es || 'No description'; 
    return { "to": $json.target_wa, "body": "*📢 ALERT DUBAI*\\n📍 *" + ($json.city || 'Dubai') + "* | 💰 *" + ($json.budget || 'Negotiable') + "*\\n\\n" + text + "\\n\\n👤 *Contact:* " + ($json.contact || 'Unknown') + "\\n🔌 *Source:* " + ($json.platform || 'WhatsApp') }; 
  } else { 
    return { "to": $json.target_wa, "body": "*📢 ALERTA " + ($json.city_label || 'GLOBAL') + "*\\n📍 *" + ($json.city || 'Desconocida') + "* | 💰 *" + ($json.budget || 'Negociable') + "*\\n\\n" + ($json.text_es || 'Sin descripción') + "\\n\\n👤 *Remitente:* " + ($json.contact || 'Desconocido') + "\\n🔌 *Fuente:* " + ($json.platform || 'WhatsApp') }; 
  } 
})() }}`; 
    console.log('Updated ' + n.name); 
  }
  
  if (n.name.startsWith('Dynamic Routing Engine') && n.parameters?.jsCode) {
    if (!n.parameters.jsCode.includes('905344119396')) {
      const dubaiBlock = `,\n  "dubai": {\n    keywords: ["dubai", "uae", "emirates", "abu dhabi", "aed", "sharjah"],\n    targets: [\n      { to: "905344119396@s.whatsapp.net", label: "DUBAI" }\n    ]\n  }`;
      n.parameters.jsCode = n.parameters.jsCode.replace(/(\}\s*\n\};)/, `}${dubaiBlock}\n};`);
      console.log('Updated routing table for ' + n.name);
    }
  }
}); 

fs.writeFileSync(file, JSON.stringify(wf, null, 2));
