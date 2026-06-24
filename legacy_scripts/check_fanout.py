import json
import subprocess

DB = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

result = subprocess.run(['sqlite3', DB, "SELECT nodes FROM workflow_entity WHERE id='A0QpoDzX559wzRXQ' LIMIT 1;"], capture_output=True, text=True)
raw = result.stdout.strip()
if raw:
    nodes = json.loads(raw)
    for n in nodes:
        if n.get('name') == 'Telegram Fanout':
            print("--- Telegram Fanout ---")
            print(json.dumps(n, indent=2))
