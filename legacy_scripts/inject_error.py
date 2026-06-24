import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

dre_code = """
throw new Error("DEBUG DUMP: " + JSON.stringify($json));
"""

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    nodes = json.loads(row['nodes'])
    
    for node in nodes:
        if node['name'] == 'Dynamic Routing Engine':
            # Save original
            node['parameters']['originalJsCode'] = node['parameters']['jsCode']
            node['parameters']['jsCode'] = dre_code

    new_nodes = json.dumps(nodes)
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_nodes,))
    conn.commit()
    print("Injected error into DRE to force saving execution data!")
    
    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
