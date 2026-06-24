import json
import subprocess

subprocess.run(["docker", "exec", "n8n", "n8n", "export:workflow", "--id=A0QpoDzX559wzRXQ", "--output=/tmp/wf_patch2.json"], check=True)
subprocess.run(["docker", "cp", "n8n:/tmp/wf_patch2.json", "/tmp/wf_patch2.json"], check=True)

with open('/tmp/wf_patch2.json', 'r') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

# Remove Dynamic Routing Engine -> Telegram Fanout connection
connections = wf.get('connections', {})
if 'Dynamic Routing Engine' in connections:
    main_targets = connections['Dynamic Routing Engine'].get('main', [])
    for branch in main_targets:
        if branch:
            # Keep only targets that are NOT Telegram Fanout
            branch[:] = [t for t in branch if t['node'] != 'Telegram Fanout']

with open('/tmp/wf_patch2_out.json', 'w') as f:
    json.dump(wf, f)

subprocess.run(["docker", "cp", "/tmp/wf_patch2_out.json", "n8n:/tmp/wf_patch2_out.json"], check=True)
subprocess.run(["docker", "exec", "n8n", "n8n", "import:workflow", "--input=/tmp/wf_patch2_out.json"], check=True)
print("Disconnected Dynamic Routing Engine from Telegram Fanout")
