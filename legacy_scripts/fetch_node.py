import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
target_id = 'A0QpoDzX559wzRXQ'

def fetch_node(name):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT nodes FROM workflow_entity WHERE id = ?', (target_id,))
    row = cursor.fetchone()
    if row:
        nodes = json.loads(row[0])
        node = [n for n in nodes if n['name'] == name][0]
        print(json.dumps(node))
    conn.close()

if __name__ == "__main__":
    fetch_node('Link Extractor')
