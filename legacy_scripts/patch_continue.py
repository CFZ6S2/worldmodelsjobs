import sqlite3
import json
import subprocess

DB = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

result = subprocess.run(['sqlite3', DB, "SELECT rowid, nodes FROM workflow_entity;"], capture_output=True, text=True)
lines = result.stdout.strip().split('\n')
for line in lines:
    if not line.strip(): continue
    parts = line.split('|', 1)
    if len(parts) < 2: continue
    rowid = parts[0]
    
    try:
        nodes = json.loads(parts[1])
    except Exception as e:
        continue
    
    modified = False
    for n in nodes:
        if n.get('name') in ['Telegram Fanout', 'WhatsApp Fanout', 'Dynamic WhatsApp Alert']:
            n['continueOnFail'] = True
            n['onError'] = 'continueRegularOutput'
            modified = True
                
    if modified:
        new_json = json.dumps(nodes)
        new_json_escaped = new_json.replace("'", "''")
        update = f"UPDATE workflow_entity SET nodes='{new_json_escaped}' WHERE rowid={rowid};"
        subprocess.run(['sqlite3', DB, update])
        print(f"Patched continueOnFail on row {rowid}")
