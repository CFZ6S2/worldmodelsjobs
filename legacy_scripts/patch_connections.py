import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, connections FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    connections = json.loads(row['connections'])
    
    # Change Dynamic Routing Engine's output to bypass Global Alert Waiter and go straight to Dynamic WhatsApp Alert
    connections["Dynamic Routing Engine"] = {
        "main": [
            [
                {
                    "node": "Dynamic WhatsApp Alert",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    }
    
    # We can also remove Global Alert Waiter from connections just to be clean
    if "Global Alert Waiter" in connections:
        del connections["Global Alert Waiter"]

    new_connections = json.dumps(connections)
    c.execute("UPDATE workflow_entity SET connections = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_connections,))
    conn.commit()
    print("Successfully patched connections to bypass Global Alert Waiter!")
    
    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
