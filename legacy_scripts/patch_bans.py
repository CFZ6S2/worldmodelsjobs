import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    nodes = json.loads(row['nodes'])
    
    for node in nodes:
        if node['name'] == 'Pre-Filter Unified1':
            code = node['parameters']['jsCode']
            code = code.replace(
                'const BANNED_PREFIXES = ["58", "57", "92", "91", "62", "244"];',
                'const BANNED_PREFIXES = ["58", "57", "92", "91", "62", "244", "5521981236891", "558396415629"];'
            )
            node['parameters']['jsCode'] = code
            
    new_nodes = json.dumps(nodes)
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_nodes,))
    conn.commit()
    print("Bans added successfully!")
    conn.close()

except Exception as e:
    print(f"Error: {e}")
