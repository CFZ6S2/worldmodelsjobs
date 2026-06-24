import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, name, nodes FROM workflow_entity")
    rows = c.fetchall()
    
    for row in rows:
        if 'b6c5b0df-1d69-4509-9154-db2a2a07c293' in row['nodes']:
            print(f"Workflow ID: {row['id']} - Name: {row['name']}")
            print("Found webhook!")

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
