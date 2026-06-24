import json

with open('/tmp/current_wf.json') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

for n in wf.get('nodes', []):
    if n['name'] == 'IA Extract1':
        print("IA Extract1 prompt text:")
        print(n['parameters'].get('text', 'NO TEXT PARAMETER'))
