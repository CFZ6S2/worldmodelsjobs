import json

with open('/tmp/wf_wa_out.json', 'r') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

for n in wf.get('nodes', []):
    if n['name'] == 'Extract Metadata WA1':
        print("======== EXTRACT METADATA WA1 CODE ========")
        print(n['parameters']['jsCode'])
