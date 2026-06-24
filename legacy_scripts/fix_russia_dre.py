import json
import subprocess

subprocess.run(["docker", "exec", "n8n", "n8n", "export:workflow", "--id=A0QpoDzX559wzRXQ", "--output=/tmp/wf_patch15.json"], check=True)
subprocess.run(["docker", "cp", "n8n:/tmp/wf_patch15.json", "/tmp/wf_patch15.json"], check=True)

with open('/tmp/wf_patch15.json', 'r') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

patched = False
for n in wf.get('nodes', []):
    if n['name'] == 'Parse JSON1':
        old_code = n['parameters']['jsCode']
        if 'original_text:' not in old_code:
            new_code = old_code.replace('trash: parsed.trash === true || (parsed.category === \'trash\' && !isJobish) || false', 'trash: parsed.trash === true || (parsed.category === \'trash\' && !isJobish) || false,\n  original_text: originalText')
            n['parameters']['jsCode'] = new_code
            patched = True

    if n['name'] == 'Dynamic Routing Engine':
        old_code = n['parameters']['jsCode']
        # Remove russia_turkey from routingTable
        new_code = old_code.replace('''"russia_turkey": {
    keywords: ["rusia", "russia", "\\\\bru\\\\b", "россия", "moscu", "moscow", "москва", "san petersburgo", "saint petersburg", "st petersburg", "санкт-петербург", "питер", "kazan", "kazán", "казань", "sochi", "сочи", "vladivostok", "владивосток", "novosibirsk", "новосибирск", "ekaterimburgo", "yekaterinburg", "екатеринбург", "baku", "bakú", "баку", "tiflis", "tbilisi", "тбилиси", "kiev", "kyiv", "киев", "київ", "киів", "turquia", "turquía", "turkey", "türkiye", "турция", "estambul", "istanbul", "стамбул", "ankara", "анкара", "antalya", "анталья", "анталия", "izmir", "esmirna", "измир", "bodrum", "бодрум", "bursa", "бурса", "capadocia", "cappadocia", "каппадокия"],
    targets: []
  },''', '')
        # Update textRaw to include original_text
        new_code = new_code.replace('const textRaw = String($json.text_es || "").toLowerCase().trim();', 'const textRaw = String(($json.text_es || "") + " " + ($json.original_text || "")).toLowerCase().trim();')
        n['parameters']['jsCode'] = new_code
        patched = True

    if n['name'] == 'Message Router':
        old_code = n['parameters']['jsCode']
        new_code = old_code.replace('const textRaw = String($json.text_es || "").toLowerCase().trim();', 'const textRaw = String(($json.text_es || "") + " " + ($json.original_text || "")).toLowerCase().trim();')
        n['parameters']['jsCode'] = new_code
        patched = True

if patched:
    with open('/tmp/wf_patch15_out.json', 'w') as f:
        json.dump(wf, f)
    subprocess.run(["docker", "cp", "/tmp/wf_patch15_out.json", "n8n:/tmp/wf_patch15_out.json"], check=True)
    subprocess.run(["docker", "exec", "n8n", "n8n", "import:workflow", "--input=/tmp/wf_patch15_out.json"], check=True)
    print("Fixed DRE Russia issue and added original_text check")
else:
    print("Already patched or not found")
