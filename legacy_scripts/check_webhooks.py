import json

with open('/tmp/current_wf.json') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

print(f"Workflow ID: {wf.get('id')}")
for n in wf.get('nodes', []):
    if n['type'].startswith('n8n-nodes-base.webhook'):
        print(f"Webhook Node: {n['name']}")
        print(f"  Webhook ID: {n.get('webhookId')}")
        print(f"  Path: {n.get('parameters', {}).get('path')}")
