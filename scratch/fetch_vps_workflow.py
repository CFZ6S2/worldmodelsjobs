import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
target_id = 'A0QpoDzX559wzRXQ'

def fetch():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT nodes, connections FROM workflow_entity WHERE id = ?', (target_id,))
    row = cursor.fetchone()
    if row:
        data = {'nodes': json.loads(row[0]), 'connections': json.loads(row[1])}
        print(json.dumps(data))
    conn.close()

if __name__ == "__main__":
    fetch()
