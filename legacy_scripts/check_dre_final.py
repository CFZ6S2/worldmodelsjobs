import json

with open('/tmp/wf_debug.json', 'r') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

for n in wf.get('nodes', []):
    if n['name'] == 'Dynamic Routing Engine':
        print(n['parameters']['jsCode'])
