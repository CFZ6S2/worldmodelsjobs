import sqlite3
import json

db_path = '/root/.n8n/database.sqlite'
id_to_update = 'mpJxAxn2Y5qEAarU'

def list_nodes():
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT nodes FROM workflow_entity WHERE id = ?', (id_to_update,))
        row = cursor.fetchone()
        if not row:
            print('Workflow not found')
            return
        nodes = json.loads(row[0])
        print(f"Workflow ID: {id_to_update}")
        print("Nodes found:")
        for node in nodes:
            print(f"- {node['name']} ({node['type']})")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    list_nodes()
