import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    nodes = json.loads(row['nodes'])
    
    for node in nodes:
        if node['name'] == 'Dynamic Routing Engine':
            js_code = node['parameters']['jsCode']
            
            # Remove the return [] block that stops Telegram
            js_code = js_code.replace("if (!finalTarget) return [];\n\n", "")
            
            # Change finalTarget = null to finalTarget = "" so it doesn't cause errors when mapped
            js_code = js_code.replace("let finalTarget = null;", "let finalTarget = \"\";")

            node['parameters']['jsCode'] = js_code

    new_nodes = json.dumps(nodes)
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_nodes,))
    conn.commit()
    print("DRE patched successfully to restore Telegram flow!")
    conn.close()

except Exception as e:
    print(f"Error: {e}")
