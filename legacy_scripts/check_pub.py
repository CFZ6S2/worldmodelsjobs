import json
import subprocess

DB = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

result = subprocess.run(['sqlite3', DB, "SELECT nodes FROM workflow_published_version WHERE workflowId='A0QpoDzX559wzRXQ' LIMIT 1;"], capture_output=True, text=True)
raw = result.stdout.strip()
if raw:
    try:
        nodes = json.loads(raw)
        has_uk = False
        for n in nodes:
            js = str(n.get('parameters', {}).get('jsCode', ''))
            if '447471373828' in js or '8653719069' in js:
                has_uk = True
        print("Has new numbers in published version:", has_uk)
    except Exception as e:
        print("Error parsing:", e)
else:
    print("No published version found")
