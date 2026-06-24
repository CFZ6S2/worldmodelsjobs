import json
import subprocess

subprocess.run(["docker", "exec", "n8n", "n8n", "export:workflow", "--id=A0QpoDzX559wzRXQ", "--output=/tmp/wf_patch9.json"], check=True)
subprocess.run(["docker", "cp", "n8n:/tmp/wf_patch9.json", "/tmp/wf_patch9.json"], check=True)

with open('/tmp/wf_patch9.json', 'r') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

patched = False
for n in wf.get('nodes', []):
    if n['name'] == 'Parse JSON1':
        code = n['parameters']['jsCode']
        
        # Fix the reference error
        new_code = code.replace('let formattedContact = origContact || "Desconocido";', 'let origContact = input.sender_contact || input.final_contact || "Desconocido";\nlet formattedContact = origContact;')
        
        # Also fix finalData if it was broken
        new_code = new_code.replace('contact: input.sender_contact || input.final_contact || "Desconocido",', 'contact: formattedContact,')
        
        if code != new_code:
            n['parameters']['jsCode'] = new_code
            patched = True

if patched:
    with open('/tmp/wf_patch9_out.json', 'w') as f:
        json.dump(wf, f)
    subprocess.run(["docker", "cp", "/tmp/wf_patch9_out.json", "n8n:/tmp/wf_patch9_out.json"], check=True)
    subprocess.run(["docker", "exec", "n8n", "n8n", "import:workflow", "--input=/tmp/wf_patch9_out.json"], check=True)
    print("Fixed Parse JSON1 ReferenceError")
else:
    print("Could not find Parse JSON1 node or already patched")
