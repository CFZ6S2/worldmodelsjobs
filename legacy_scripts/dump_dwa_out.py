import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT data FROM execution_data WHERE executionId = 162646")
    row = c.fetchone()
    
    data = json.loads(row['data'])
    
    # Simple manual unflattener for basic debugging
    # The data is a list of strings and dicts where values might be string indices pointing to other list elements
    def unflat(idx):
        if not isinstance(idx, str) or not idx.isdigit():
            return idx
        val = data[int(idx)]
        if isinstance(val, dict):
            return {k: unflat(v) for k, v in val.items()}
        if isinstance(val, list):
            return [unflat(v) for v in val]
        return val

    # Find the runData node
    # From previous dump: data[4] is {"Webhook WhatsApp": "12", ... "Dynamic WhatsApp Alert": "26"}
    # Let's search for the key "Dynamic WhatsApp Alert"
    for i, item in enumerate(data):
        if isinstance(item, dict) and 'Dynamic WhatsApp Alert' in item:
            print("Found node indices in element", i)
            node_idx = item['Dynamic WhatsApp Alert']
            print("Dynamic WhatsApp Alert data index:", node_idx)
            print(json.dumps(unflat(node_idx), indent=2))
            break
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
