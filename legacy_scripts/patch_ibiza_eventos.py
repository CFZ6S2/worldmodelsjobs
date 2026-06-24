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
        if node['name'] == 'Dynamic Routing Engine':
            js_code = node['parameters']['jsCode']
            
            # Add categoryFilter 'evento' to the old girl (+34 601) for Ibiza
            js_code = js_code.replace(
                '{ to: "34601169815@s.whatsapp.net", label: "IBIZA" }',
                '{ to: "34601169815@s.whatsapp.net", label: "IBIZA", categoryFilter: "evento" }'
            )
            node['parameters']['jsCode'] = js_code

    new_nodes = json.dumps(nodes)
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_nodes,))
    conn.commit()
    print("Ibiza filter patched successfully!")
    conn.close()

except Exception as e:
    print(f"Error: {e}")
