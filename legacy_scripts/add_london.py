import json
import subprocess
import re

subprocess.run(["docker", "exec", "n8n", "n8n", "export:workflow", "--id=A0QpoDzX559wzRXQ", "--output=/tmp/wf_patch7.json"], check=True)
subprocess.run(["docker", "cp", "n8n:/tmp/wf_patch7.json", "/tmp/wf_patch7.json"], check=True)

with open('/tmp/wf_patch7.json', 'r') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

patched = False
for n in wf.get('nodes', []):
    if n['name'] == 'Dynamic Routing Engine':
        code = n['parameters']['jsCode']
        
        # Add London and Switzerland to the routing table
        addition = '''  "london": {
    keywords: ["london", "londres", "mayfair", "soho", "chelsea", "\\\\buk\\\\b", "england", "inglaterra"],
    targets: [
      { to: "447438757923@s.whatsapp.net", label: "LONDON" }
    ]
  },
  "suiza": {
    keywords: ["suiza", "switzerland", "zurich", "ginebra", "basilea", "berna", "lausana", "lugano", "lucerna", "schweiz", "suisse", "svizzera", "zurigo"],
    targets: [
      { to: "573183836809@s.whatsapp.net", label: "SUIZA" }
    ]
  },
'''
        # Insert it before "amsterdam"
        new_code = code.replace('"amsterdam": {', addition + '  "amsterdam": {')
        n['parameters']['jsCode'] = new_code
        patched = True

if patched:
    with open('/tmp/wf_patch7_out.json', 'w') as f:
        json.dump(wf, f)
    subprocess.run(["docker", "cp", "/tmp/wf_patch7_out.json", "n8n:/tmp/wf_patch7_out.json"], check=True)
    subprocess.run(["docker", "exec", "n8n", "n8n", "import:workflow", "--input=/tmp/wf_patch7_out.json"], check=True)
    print("Added London and Switzerland to DRE routing table")
else:
    print("Could not find DRE node to patch")
