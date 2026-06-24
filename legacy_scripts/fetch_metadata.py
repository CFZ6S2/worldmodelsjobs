import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
target_id = 'A0QpoDzX559wzRXQ'

def fetch():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT nodes FROM workflow_entity WHERE id = ?', (target_id,))
    row = cursor.fetchone()
    nodes = json.loads(row[0])
    
    for n in nodes:
        if n['name'] == 'Extract Metadata WA1':
            print(n['parameters'].get('jsCode', 'No code found'))
            break

if __name__ == "__main__":
    fetch()
