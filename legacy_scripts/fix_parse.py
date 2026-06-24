import json
import subprocess

with open('/tmp/current_wf.json') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

PARSE_CODE = '''// PARSE JSON v6.0 (FIXED METADATA RECOVERY)
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

// Safely recover original metadata from upstream nodes
let originalItem = null;
try {
    originalItem = $('Dedup Hash1').item.json;
} catch(e) {
    try {
        originalItem = $('Pre-Filter Unified1').item.json;
    } catch(err) {}
}

const originalText = originalItem ? (originalItem.texto_limpio || "") : "";
const origPlatform = originalItem ? originalItem.platform : input.platform;
const origContact = originalItem ? (originalItem.sender_contact || originalItem.final_contact || originalItem.from) : (input.sender_contact || input.final_contact);
const origChatId = originalItem ? originalItem.source_chat_id : input.source_chat_id;

const lowerRaw = originalText.toLowerCase();
const isJobish = lowerRaw.includes("busco") || lowerRaw.includes("disponible") || lowerRaw.includes("casting") || lowerRaw.includes("tour") || lowerRaw.length > 20;

const finalData = {
  platform: origPlatform || "WhatsApp",
  contact: origContact || "Desconocido",
  source_chat_id: origChatId || "0",
  city: parsed.city || "Global",
  budget: parsed.budget || "Negociable",
  category: (parsed.category || (isJobish ? "evento" : "trash")).toLowerCase(),
  text_es: parsed.text_es || originalText || "Sin descripción",
  title_es: parsed.title_es || (originalText ? originalText.substring(0, 40) : "Nuevo Lead"),
  trash: parsed.trash === true || (parsed.category === 'trash' && !isJobish) || false
};

const highValueKeywords = ["mansour", "ibiza", "lio", "pacha", "eivissa", "mansur", "monaco", "viena", "vienna", "dubai", "suiza", "switzerland", "london", "londres"];
if (highValueKeywords.some(kw => lowerRaw.includes(kw))) {
  finalData.trash = false;
  if (finalData.category === 'trash') finalData.category = "evento";
}

return [{ json: finalData }];
'''

patched = False
for n in wf.get('nodes', []):
    if n['name'] == 'Parse JSON1':
        n['parameters']['jsCode'] = PARSE_CODE
        patched = True

if patched:
    with open('/tmp/wf_patch4.json', 'w') as f:
        json.dump(wf, f)
    subprocess.run(["docker", "cp", "/tmp/wf_patch4.json", "n8n:/tmp/wf_patch4.json"], check=True)
    subprocess.run(["docker", "exec", "n8n", "n8n", "import:workflow", "--input=/tmp/wf_patch4.json"], check=True)
    print("Patched Parse JSON1 successfully to recover contact info")
else:
    print("Could not find Parse JSON1 node")
