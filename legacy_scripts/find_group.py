import json
with open('/root/worldmodels-jobs/juana_groups.json', 'r') as f:
    data = json.load(f)
groups = data.get('groups', [])
print('Total:', len(groups))
target = '120363425790792660@g.us'
for g in groups:
    if g.get('id') == target:
        print('MATCH:', g)
    if 'ESPAÑA' in (g.get('name') or '').upper():
        print('ESP:', g.get('name'), g.get('id'))
