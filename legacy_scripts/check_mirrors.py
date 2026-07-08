import json
mirrors = [
    '120363408216646972@g.us',
    '120363408298375271@g.us',
    '120363426262586004@g.us',
    '120363425790792660@g.us'
]
with open('/root/worldmodels-jobs/juana_groups.json', 'r') as f:
    data = json.load(f)
groups = {g.get('id'): g.get('name') for g in data.get('groups', [])}
for m in mirrors:
    if m in groups:
        print(f'✅ FOUND: {m} -> {groups[m]}')
    else:
        print(f'❌ NOT FOUND: {m}')
