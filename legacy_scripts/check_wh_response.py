import json

with open('/tmp/current_wf.json') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

for n in wf.get('nodes', []):
    if n['type'].startswith('n8n-nodes-base.webhook'):
        print(f"Webhook {n['name']} parameters:")
        print(json.dumps(n['parameters'], indent=2))
