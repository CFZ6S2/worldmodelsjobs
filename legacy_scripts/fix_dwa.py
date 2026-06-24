import json
import subprocess

subprocess.run(["docker", "exec", "n8n", "n8n", "export:workflow", "--id=A0QpoDzX559wzRXQ", "--output=/tmp/wf_patch10.json"], check=True)
subprocess.run(["docker", "cp", "n8n:/tmp/wf_patch10.json", "/tmp/wf_patch10.json"], check=True)

with open('/tmp/wf_patch10.json', 'r') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

patched = False
for n in wf.get('nodes', []):
    if n['name'] == 'Dynamic WhatsApp Alert':
        old_code = n['parameters'].get('jsonBody', '')
        if 'JSON.stringify' not in old_code:
            # Wrap the existing IIFE in JSON.stringify
            new_code = old_code.replace('={{ (() => {', '={{ JSON.stringify((() => {')
            new_code = new_code.replace('})() }}', '})()) }}')
            n['parameters']['jsonBody'] = new_code
            patched = True

if patched:
    with open('/tmp/wf_patch10_out.json', 'w') as f:
        json.dump(wf, f)
    subprocess.run(["docker", "cp", "/tmp/wf_patch10_out.json", "n8n:/tmp/wf_patch10_out.json"], check=True)
    subprocess.run(["docker", "exec", "n8n", "n8n", "import:workflow", "--input=/tmp/wf_patch10_out.json"], check=True)
    print("Fixed Dynamic WhatsApp Alert JSON stringify")
else:
    print("Already patched or not found")
