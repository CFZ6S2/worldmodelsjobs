import json

with open('/tmp/current_wf.json') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

for n in wf.get('nodes', []):
    if n['name'] == 'Message Router':
        print(f"Message Router type: {n['type']}")
        print(json.dumps(n.get('parameters', {}), indent=2))
