import json
import subprocess

DB = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
result = subprocess.run(['sqlite3', DB, "SELECT workflowData FROM execution_data WHERE executionId=28191;"], capture_output=True, text=True)
raw = result.stdout.strip()
if raw:
    try:
        data = json.loads(raw)
        print("Got nodes:", [n.get('name') for n in data.get('workflowData', {}).get('nodes', [])])
    except Exception as e:
        print("Error parsing:", e)
