import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT connections FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    connections = json.loads(row['connections'])
    
    print("Nodes connecting TO Telegram Fanout:")
    for src_node, outputs in connections.items():
        if 'main' in outputs:
            for conn_group in outputs['main']:
                for target in conn_group:
                    if target['node'] == 'Telegram Fanout':
                        print(src_node)

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
