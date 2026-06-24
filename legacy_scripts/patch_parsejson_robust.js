const fs = require('fs');

const wf = JSON.parse(fs.readFileSync('scratch/final_v5_patched_fixed2.json', 'utf8'));

let parseJson = wf.nodes.find(n => n.name === 'Parse JSON1');

const newCode = `// PARSE JSON v5.9 (METADATA PRESERVE ROBUST)
const input = $json;
const rawText = input.output || input.text || "";
const cleanText = rawText.replace(/\`\`\`json|\`\`\`/g, '').trim();

// RECUPERAR METADATA PERDIDA de Dedup Hash1 (el nodo inmediatamente anterior a la IA)
let prevItem = {};
try { prevItem = $items("Dedup Hash1")[0].json; } catch(e) {}

const platform = prevItem.platform || input.platform || "WhatsApp";
let contact = prevItem.final_contact || prevItem.sender_contact || input.sender_contact || input.final_contact || "Desconocido";

// Si el contacto es un ID de grupo, lo marcamos como Desconocido
if (String(contact).includes('@g.us') || String(contact).length > 20) { contact = "Desconocido"; } else if (/^\\d{7,15}$/.test(String(contact))) { contact = '+' + contact; } 

let parsed = {};
try {
  if (cleanText) parsed = JSON.parse(cleanText);
} catch (e) {
  const catMatch = cleanText.match(/"category"\\s*:\\s*"(.*?)"/i);
  if (catMatch) parsed.category = catMatch[1];
}

const originalTextoLimpio = prevItem.texto_limpio || "";
const lowerRaw = originalTextoLimpio.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
const isJobish = lowerRaw.includes("busco") || lowerRaw.includes("disponible") || lowerRaw.length > 20;

const finalData = {
  platform,
  contact,
  texto_limpio: originalTextoLimpio,
  source_chat_id: prevItem.source_chat_id || input.source_chat_id || "0",
  city: parsed.city || "Global",
  budget: parsed.budget || "Negociable",
  category: (parsed.category || (isJobish ? "evento" : "trash")).toLowerCase(),
  text_es: parsed.text_es || originalTextoLimpio || "Sin descripción",
  title_es: parsed.title_es || (lowerRaw ? lowerRaw.substring(0, 40) : "Nuevo Lead"),
  text_en: parsed.text_en || "",
  title_en: parsed.title_en || "",
  text_ru: parsed.text_ru || "",
  title_ru: parsed.title_ru || "",
  text_pt: parsed.text_pt || "",
  title_pt: parsed.title_pt || "",
  trash: parsed.trash === true || (parsed.category === 'trash' && !isJobish) || false
};

const highValueKeywords = ["mansour", "ibiza", "lio", "pacha", "monaco", "viena", "dubai", "manila"];
if (highValueKeywords.some(kw => lowerRaw.includes(kw))) {
  finalData.trash = false;
  if (finalData.category === 'trash') finalData.category = "evento";
}

return [{ json: finalData }];`;

parseJson.parameters.jsCode = newCode;
fs.writeFileSync('scratch/final_v5_patched_fixed2.json', JSON.stringify(wf, null, 2));
console.log("scratch/final_v5_patched_fixed2.json updated with bulletproof metadata preservation!");
