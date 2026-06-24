import json
import subprocess

DB = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

result = subprocess.run(['sqlite3', DB, "SELECT nodes FROM workflow_entity WHERE id='A0QpoDzX559wzRXQ' LIMIT 1;"], capture_output=True, text=True)
raw = result.stdout.strip()
if raw:
    nodes = json.loads(raw)
    for n in nodes:
        if n.get('name') == 'Message Router':
            print("--- Message Router ---")
            print(n.get('parameters', {}).get('jsCode', ''))
        if n.get('name') == 'Dynamic Routing Engine':
            print("--- Dynamic Routing Engine ---")
            print(n.get('parameters', {}).get('jsCode', ''))
