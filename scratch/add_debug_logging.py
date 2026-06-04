import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
target_id = 'A0QpoDzX559wzRXQ'

def add_logging():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT nodes FROM workflow_entity WHERE id = ?', (target_id,))
    row = cursor.fetchone()
    if not row:
        print("Workflow not found.")
        return
    
    nodes = json.loads(row[0])
    for n in nodes:
        if n['name'] == 'Link Extractor':
            current_code = n['parameters']['jsCode']
            if 'console.log' not in current_code:
                n['parameters']['jsCode'] = 'console.log("--- EXTRACTOR INPUT ---", JSON.stringify($json));\n' + current_code
            break
            
    cursor.execute('UPDATE workflow_entity SET nodes = ?, updatedAt = datetime("now") WHERE id = ?', 
                   (json.dumps(nodes), target_id))
    conn.commit()
    conn.close()
    print('DEBUG LOGGING ADDED to Link Extractor.')

if __name__ == "__main__":
    add_logging()
