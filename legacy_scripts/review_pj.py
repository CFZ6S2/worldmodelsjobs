import json

with open('/tmp/wf_patch9_out.json', 'r') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

for n in wf.get('nodes', []):
    if n['name'] == 'Parse JSON1':
        print(n['parameters'].get('jsCode', ''))
