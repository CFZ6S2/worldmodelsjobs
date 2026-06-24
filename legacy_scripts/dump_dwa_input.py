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
    
    def unflat(idx):
        if not isinstance(idx, str) or not idx.isdigit():
            return idx
        val = data[int(idx)]
        if isinstance(val, dict):
            return {k: unflat(v) for k, v in val.items()}
        if isinstance(val, list):
            return [unflat(v) for v in val]
        return val

    # The input to Dynamic WhatsApp Alert is the output of Global Alert Waiter,
    # or the output of Dynamic Routing Engine!
    dre_idx = None
    for i, item in enumerate(data):
        if isinstance(item, dict) and 'Dynamic Routing Engine' in item:
            dre_idx = item['Dynamic Routing Engine']
            break
            
    print(json.dumps(unflat(dre_idx), indent=2))
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
