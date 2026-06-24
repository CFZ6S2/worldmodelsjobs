import json
import subprocess

DB = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
result = subprocess.run(['sqlite3', DB, "SELECT nodes FROM workflow_entity WHERE id='A0QpoDzX559wzRXQ';"], capture_output=True, text=True)
raw = result.stdout.strip()
if raw:
    try:
        nodes = json.loads(raw)
        for n in nodes:
            if n.get('name') == 'Message Router':
                js_code = n.get('parameters', {}).get('jsCode', '')
                print("--- Message Router ---")
                print(js_code)
    except Exception as e:
        print("Error parsing:", e)
