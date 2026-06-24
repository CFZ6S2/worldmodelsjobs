import sqlite3
import json
import re

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
            
            # 1. Modify the IBIZA entry to add the new target
            old_ibiza = r'"ibiza": {\s*keywords: \["ibiza", "eivissa"\],\s*targets: \[\s*\{\s*to: "34601169815@s.whatsapp.net", label: "IBIZA"\s*\}\s*\]\s*}'
            new_ibiza = '''"ibiza": {
    keywords: ["ibiza", "eivissa"],
    targets: [
      { to: "34601169815@s.whatsapp.net", label: "IBIZA" },
      { to: "34670652138@s.whatsapp.net", label: "IBIZA", categoryFilter: "evento, habitacion" }
    ]
  }'''
            code = re.sub(old_ibiza, new_ibiza, code)

            # 2. Add MARBELLA entry after IBIZA
            marbella_entry = ''',\n  "marbella": {
    keywords: ["marbella", "puerto banus", "costa del sol", "malaga", "málaga", "estepona"],
    targets: [
      { to: "34670652138@s.whatsapp.net", label: "MARBELLA", categoryFilter: "evento, habitacion" }
    ]
  }'''
            # Find the end of the ibiza block and insert marbella
            code = code.replace(new_ibiza, new_ibiza + marbella_entry)
            
            node['parameters']['jsCode'] = code
            print("Patched Dynamic Routing Engine for Ibiza and Marbella.")

    new_nodes_json = json.dumps(nodes)
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_nodes_json,))
    conn.commit()
    conn.close()
    
    print("Successfully updated database.")

except Exception as e:
    print(f"Script Error: {e}")
