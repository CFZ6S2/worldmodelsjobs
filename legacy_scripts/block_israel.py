import json
import subprocess

with open('/tmp/current_wf.json') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

PRE_CODE = '''
const results = [];
const HARD_BLOCK = new Set([
  "crypto", "binance", "casino", "usdt", "bitcoin", "wallet", "trading", "ganar dinero", 
  "инди", "контент", "onlyfans", "вирт", "sugar baby", "sugar daddy", "anal", "masaje erotico", 
  "ingles", "english",
  "israel", "tel aviv", "telaviv", "haifa", "jerusalem", "jerusalen",
  "miami", "usa", "u.s.a", "estados unidos", "united states", "los angeles", "new york", "las vegas"
]);
const BANNED_PREFIXES = ["58", "57", "92", "91", "62", "244", "972"]; // 972 is Israel

function norm(v) { return String(v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

for (const item of $input.all()) {
  const data = item.json;
  const text = norm(data.texto_limpio);
  const sender = String(data.final_contact || data.from || "").replace(/\D/g, "");

  // Bloquear por prefijo baneado
  if (BANNED_PREFIXES.some(p => sender.startsWith(p))) continue;
  
  // Bloquear por palabra clave prohibida
  if ([...HARD_BLOCK].some(k => {
      if (k === "usa") {
          return new RegExp("\\\\busa\\\\b", "i").test(text);
      }
      return text.includes(k);
  })) continue;
  
  // Si no hay texto, no tiene sentido enviarlo a la IA
  if (!text || text.length < 10) continue;

  // Solo los que pasan todos los filtros salen del nodo
  results.push(item);
}
return results;
'''

patched = False
for n in wf.get('nodes', []):
    if n['name'] == 'Pre-Filter Unified1':
        n['parameters']['jsCode'] = PRE_CODE
        patched = True

if patched:
    with open('/tmp/wf_patch3.json', 'w') as f:
        json.dump(wf, f)
    subprocess.run(["docker", "cp", "/tmp/wf_patch3.json", "n8n:/tmp/wf_patch3.json"], check=True)
    subprocess.run(["docker", "exec", "n8n", "n8n", "import:workflow", "--input=/tmp/wf_patch3.json"], check=True)
    print("Patched Pre-Filter Unified1 with Israel/USA blocked words and 972 prefix")
else:
    print("Could not find Pre-Filter node")
