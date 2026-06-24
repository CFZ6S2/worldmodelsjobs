import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
target_id = 'fP1vB4Y5OAgCbw0v'

def fetch():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT nodes, connections FROM workflow_entity WHERE id = ?', (target_id,))
    row = cursor.fetchone()
    if row:
        with open('/tmp/active_nodes.json', 'w') as f:
            json.dump(json.loads(row[0]), f)
        with open('/tmp/active_connections.json', 'w') as f:
            json.dump(json.loads(row[1]), f)
        print("FETCH SUCCESSFUL")
    else:
        print("NOT FOUND")
    conn.close()

if __name__ == "__main__":
    fetch()
