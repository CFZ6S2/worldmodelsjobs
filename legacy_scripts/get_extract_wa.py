import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    if row:
        nodes = json.loads(row['nodes'])
        for node in nodes:
            if node['name'] == 'Extract Metadata WA1':
                print(node['parameters'].get('jsCode', 'NO JS CODE'))
    conn.close()
except Exception as e:
    print(f"Error: {e}")
