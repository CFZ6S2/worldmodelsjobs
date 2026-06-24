import json
import subprocess

subprocess.run(["docker", "exec", "n8n", "n8n", "export:workflow", "--id=A0QpoDzX559wzRXQ", "--output=/tmp/wf_patch12.json"], check=True)
subprocess.run(["docker", "cp", "n8n:/tmp/wf_patch12.json", "/tmp/wf_patch12.json"], check=True)

with open('/tmp/wf_patch12.json', 'r') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

patched = False
for n in wf.get('nodes', []):
    if n['name'] == 'Parse JSON1':
        new_code = '''// PARSE JSON v5.9 (ALL LANGS + REAL SENDER RECOVERY)
const input = $json;
const rawText = input.output || input.text || "";
const cleanText = rawText.replace(/```json|```/g, '').trim();

let parsed = {};
try {
  if (cleanText) parsed = JSON.parse(cleanText);
} catch (e) {
  const catMatch = cleanText.match(/"category"\\s*:\\s*"(.*?)"/i);
  const cityMatch = cleanText.match(/"city"\\s*:\\s*"(.*?)"/i);
  if (catMatch) parsed.category = catMatch[1];
  if (cityMatch) parsed.city = cityMatch[1];
}

// Safely get texto_limpio from Dedup Hash1
let originalText = "";
try {
    originalText = $('Dedup Hash1').item.json.texto_limpio || "";
} catch(e) {
    try {
        originalText = $('Pre-Filter Unified1').item.json.texto_limpio || "";
    } catch(err) {}
}

const lowerRaw = originalText.toLowerCase();
const isJobish = lowerRaw.includes("busco") || lowerRaw.includes("disponible") || lowerRaw.includes("casting") || lowerRaw.includes("tour") || lowerRaw.length > 20;

// RECOVER SENDER CONTACT FROM EARLIER NODES!
let origContact = "Desconocido";
try { origContact = $('Extract Metadata WA1').item.json.sender_contact || "Desconocido"; } catch(e) {}
if (origContact === "Desconocido") {
    try { origContact = $('Extract Metadata TG1').item.json.sender_contact || "Desconocido"; } catch(e) {}
}
if (origContact === "Desconocido") {
    origContact = input.sender_contact || input.final_contact || "Desconocido";
}

let formattedContact = origContact;
if (formattedContact !== "Desconocido" && formattedContact !== "No disponible") {
    if (!String(formattedContact).startsWith('@') && !String(formattedContact).startsWith('tg_id_')) {
        const s = String(formattedContact).replace(/\\D/g, '');
        if (s.length >= 7) {
            formattedContact = "+" + s;
        }
    }
}

const finalData = {
  platform: "WhatsApp", // Default, might be overridden
  contact: formattedContact,
  source_chat_id: "0",
  city: parsed.city || "Global",
  budget: parsed.budget || "Negociable",
  category: (parsed.category || (isJobish ? "evento" : "trash")).toLowerCase(),
  text_es: parsed.text_es || originalText || "Sin descripción",
  title_es: parsed.title_es || (originalText ? originalText.substring(0, 40) : "Nuevo Lead"),
  
  // RESTORE ALL LANGUAGES
  text_en: parsed.text_en || "",
  title_en: parsed.title_en || "",
  text_ru: parsed.text_ru || "",
  title_ru: parsed.title_ru || "",
  text_pt: parsed.text_pt || "",
  title_pt: parsed.title_pt || "",

  trash: parsed.trash === true || (parsed.category === 'trash' && !isJobish) || false
};

// Also recover platform and source chat
try { finalData.platform = $('Extract Metadata WA1').item.json.platform || "WhatsApp"; } catch(e) {}
if (finalData.platform === "WhatsApp") {
    try { finalData.platform = $('Extract Metadata TG1').item.json.platform || "WhatsApp"; } catch(e) {}
}

const highValueKeywords = ["mansour", "ibiza", "lio", "pacha", "eivissa", "mansur", "monaco", "viena", "vienna", "dubai", "suiza", "switzerland", "london", "londres"];
if (highValueKeywords.some(kw => lowerRaw.includes(kw))) {
  finalData.trash = false;
  if (finalData.category === 'trash') finalData.category = "evento";
}

return [{ json: finalData }];
'''
        n['parameters']['jsCode'] = new_code
        patched = True

if patched:
    with open('/tmp/wf_patch12_out.json', 'w') as f:
        json.dump(wf, f)
    subprocess.run(["docker", "cp", "/tmp/wf_patch12_out.json", "n8n:/tmp/wf_patch12_out.json"], check=True)
    subprocess.run(["docker", "exec", "n8n", "n8n", "import:workflow", "--input=/tmp/wf_patch12_out.json"], check=True)
    print("Fixed Parse JSON1 translations and sender contact")
else:
    print("Already patched or not found")
