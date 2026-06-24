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
            if node['name'] == 'Dynamic Routing Engine':
                js_code = node['parameters'].get('jsCode', '')
                
                # Replace the categoryFilter for RUSSIA_TURKEY
                if '{ to: "37257825047@s.whatsapp.net", label: "RUSSIA_TURKEY", categoryFilter: "evento" }' in js_code:
                    js_code = js_code.replace(
                        '{ to: "37257825047@s.whatsapp.net", label: "RUSSIA_TURKEY", categoryFilter: "evento" }',
                        '{ to: "37257825047@s.whatsapp.net", label: "RUSSIA_TURKEY" }'
                    )
                    node['parameters']['jsCode'] = js_code
                    modified = True
                    print("Patched Dynamic Routing Engine for RUSSIA_TURKEY")
                else:
                    print("Could not find the specific string to replace.")
                    
        if modified:
            c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (json.dumps(nodes),))
            conn.commit()
            print("Database updated successfully.")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
