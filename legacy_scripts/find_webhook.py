import sqlite3

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, name FROM workflow_entity WHERE nodes LIKE '%telegram-wm-2024%'")
    for row in c.fetchall():
        print(f"Workflow ID: {row['id']}, Name: {row['name']}")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
