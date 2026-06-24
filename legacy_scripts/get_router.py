import json, subprocess

result = subprocess.run(
    ['sqlite3', '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite',
     'SELECT nodes FROM workflow_entity LIMIT 1;'],
    capture_output=True, text=True
)

raw = result.stdout.strip()
nodes = json.loads(raw)

for n in nodes:
    name = n.get('name', '')
    ntype = n.get('type', '')
    if 'code' in ntype.lower() or 'Code' in name:
        print(f"\n=== {name} ===")
        code = n.get('parameters', {}).get('jsCode', '')
        print(repr(code[:500]) if code else '[EMPTY CODE]')
