import json

with open('/root/worldmodels-jobs/WorldModels_Production_FINAL.json', 'r') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

for n in wf.get('nodes', []):
    if n['name'] == 'Extract Metadata WA1':
        print(n['parameters']['jsCode'])
