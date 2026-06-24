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
        if node.get('name') == 'Dynamic Routing Engine':
            code = node['parameters']['jsCode']
            
            # Remove the fallback to the global group
            code = code.replace("""if (matchedTargets.length === 0 && (category.includes('evento') || category.includes('plaza'))) {
  matchedTargets.push({ to: "120363425790792660@g.us", label: (cityDetected !== 'global' ? cityDetected.toUpperCase() : 'GLOBAL') });
}""", "")
            
            node['parameters']['jsCode'] = code
            print("Removed Global Group fallback from Dynamic Routing Engine.")

    new_nodes_json = json.dumps(nodes)
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_nodes_json,))
    conn.commit()
    conn.close()
    
    print("Successfully patched N8N Database.")

except Exception as e:
    print(f"Script Error: {e}")
