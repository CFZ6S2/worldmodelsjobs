import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    
    if row:
        nodes = json.loads(row['nodes'])
        modified = False
        for node in nodes:
            if node['name'] == 'Dedup Hash1':
                node['parameters']['jsCode'] = "return $input.all();"
                modified = True
                print("Patched Dedup Hash1 to pass everything")
                break
                
        if modified:
            c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (json.dumps(nodes),))
            conn.commit()
            print("Database updated successfully.")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
