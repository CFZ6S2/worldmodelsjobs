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
    
    # 1. Update Dynamic Routing Engine
    for node in nodes:
        if node.get('name') == 'Dynamic Routing Engine':
            code = node['parameters']['jsCode']
            
            if '"amsterdam"' not in code:
                # Insert amsterdam before london
                amsterdam_block = """  "amsterdam": {
    keywords: ["amsterdam", "holanda", "paises bajos", "netherlands", "nederland", "rotterdam", "la haya", "schiphol", "utrecht"],
    targets: [
      { to: "584162013551@s.whatsapp.net", label: "AMSTERDAM", categoryFilter: "evento" },
      { to: "584162013551@s.whatsapp.net", label: "AMSTERDAM", categoryFilter: "viaje" }
    ],
    telegram_targets: ["6630067001"]
  },"""
                code = code.replace('"london": {', amsterdam_block + '\n  "london": {')
                
                # Also we need a way to pass telegram target if present
                # But N8N might not have a Telegram node directly tied to DRE. Let's see the connections.
                node['parameters']['jsCode'] = code
                print("Patched DRE")

    # Save back
    new_nodes_json = json.dumps(nodes)
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_nodes_json,))
    conn.commit()
    conn.close()
    
    print("Successfully patched Amsterdam into Dynamic Routing Engine in DB.")

except Exception as e:
    print(f"Script Error: {e}")
