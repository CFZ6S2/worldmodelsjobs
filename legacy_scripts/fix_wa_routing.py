import json
import subprocess

subprocess.run(["docker", "exec", "n8n", "n8n", "export:workflow", "--id=A0QpoDzX559wzRXQ", "--output=/tmp/wf_patch5.json"], check=True)
subprocess.run(["docker", "cp", "n8n:/tmp/wf_patch5.json", "/tmp/wf_patch5.json"], check=True)

with open('/tmp/wf_patch5.json', 'r') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

# 1. Update Message Router connections to also point to Dynamic WhatsApp Alert
conns = wf.get('connections', {})
if 'Message Router' in conns:
    main_conns = conns['Message Router'].get('main', [[]])
    if len(main_conns) > 0:
        has_wa = any(t['node'] == 'Dynamic WhatsApp Alert' for t in main_conns[0])
        if not has_wa:
            main_conns[0].append({
                "node": "Dynamic WhatsApp Alert",
                "type": "main",
                "index": 0
            })

# 2. Update Dynamic WhatsApp Alert to accept wa_chat
for n in wf.get('nodes', []):
    if n['name'] == 'Dynamic WhatsApp Alert':
        old_json = n['parameters']['jsonBody']
        new_json = old_json.replace("const target = $json.target_wa || '';", "const target = $json.target_wa || $json.wa_chat || '';")
        n['parameters']['jsonBody'] = new_json

with open('/tmp/wf_patch5_out.json', 'w') as f:
    json.dump(wf, f)

subprocess.run(["docker", "cp", "/tmp/wf_patch5_out.json", "n8n:/tmp/wf_patch5_out.json"], check=True)
subprocess.run(["docker", "exec", "n8n", "n8n", "import:workflow", "--input=/tmp/wf_patch5_out.json"], check=True)
print("Patched Message Router connections and WhatsApp Alert params successfully")
