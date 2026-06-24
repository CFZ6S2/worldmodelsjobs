import json
import subprocess

subprocess.run(["docker", "exec", "n8n", "n8n", "export:workflow", "--id=A0QpoDzX559wzRXQ", "--output=/tmp/wf_patch8.json"], check=True)
subprocess.run(["docker", "cp", "n8n:/tmp/wf_patch8.json", "/tmp/wf_patch8.json"], check=True)

with open('/tmp/wf_patch8.json', 'r') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

patched = False
for n in wf.get('nodes', []):
    if n['name'] == 'Parse JSON1':
        code = n['parameters']['jsCode']
        
        # We need to replace the contact assignment in finalData
        # from: `contact: origContact || "Desconocido",`
        # to a formatted version.
        
        # Find where origContact is defined and add our formatting logic right after
        insertion = '''
let formattedContact = origContact || "Desconocido";
if (formattedContact !== "Desconocido" && formattedContact !== "No disponible") {
    // If it looks like a Telegram username or ID, leave it
    if (!String(formattedContact).startsWith('@') && !String(formattedContact).startsWith('tg_id_')) {
        const s = String(formattedContact).replace(/\\D/g, '');
        if (s.length >= 7) {
            formattedContact = "+" + s;
        }
    }
}
'''
        # Replace the `const finalData = {` with the insertion + the `const finalData = {`
        if 'const finalData = {' in code and 'formattedContact' not in code:
            new_code = code.replace('const finalData = {', insertion + '\nconst finalData = {')
            # Now replace the property inside finalData
            new_code = new_code.replace('contact: origContact || "Desconocido",', 'contact: formattedContact,')
            n['parameters']['jsCode'] = new_code
            patched = True

if patched:
    with open('/tmp/wf_patch8_out.json', 'w') as f:
        json.dump(wf, f)
    subprocess.run(["docker", "cp", "/tmp/wf_patch8_out.json", "n8n:/tmp/wf_patch8_out.json"], check=True)
    subprocess.run(["docker", "exec", "n8n", "n8n", "import:workflow", "--input=/tmp/wf_patch8_out.json"], check=True)
    print("Patched Parse JSON1 to add + to sender contact numbers")
else:
    print("Could not find Parse JSON1 node or already patched")
