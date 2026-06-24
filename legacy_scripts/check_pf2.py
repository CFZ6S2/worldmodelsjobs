import json

with open('/tmp/wf_patch13_out.json', 'r') as f:
    wf = json.load(f)

for n in wf.get('nodes', []):
    if n['name'] == 'Pre-Filter Unified1':
        print(n['parameters']['jsCode'])
