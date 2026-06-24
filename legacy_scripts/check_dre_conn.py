import json
import subprocess

subprocess.run(["docker", "exec", "n8n", "n8n", "export:workflow", "--id=A0QpoDzX559wzRXQ", "--output=/tmp/check_conn.json"], check=True)
subprocess.run(["docker", "cp", "n8n:/tmp/check_conn.json", "/tmp/check_conn.json"], check=True)

with open('/tmp/check_conn.json', 'r') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

connections = wf.get('connections', {})
if 'Dynamic Routing Engine' in connections:
    print(json.dumps(connections['Dynamic Routing Engine'], indent=2))
else:
    print("Dynamic Routing Engine has NO connections!")
