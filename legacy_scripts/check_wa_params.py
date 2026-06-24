import json

with open('/tmp/current_wf.json') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

for n in wf.get('nodes', []):
    if n['name'] == 'Dynamic WhatsApp Alert':
        print(f"Dynamic WhatsApp Alert parameters:")
        print(json.dumps(n['parameters'], indent=2))
