import sqlite3

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, name, active FROM workflow_entity")
    rows = c.fetchall()
    
    for row in rows:
        print(f"ID: {row['id']} | Name: {row['name']} | Active: {row['active']}")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
