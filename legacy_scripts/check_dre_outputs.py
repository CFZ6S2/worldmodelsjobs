import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("""
        SELECT executionId as id, data FROM execution_data 
        ORDER BY executionId DESC LIMIT 20
    """)
    rows = c.fetchall()
    
    for row in rows:
        data = json.loads(row['data'])
        # In N8N 1.0+, execution data is highly normalized
        # But we can try to search for the string "120363425790792660@g.us" in the raw JSON
        raw_str = row['data']
        if '120363425790792660@g.us' in raw_str:
            print(f"[{row['id']}] Found 120363425790792660@g.us in raw data!")
        if '37257825047@s.whatsapp.net' in raw_str:
            print(f"[{row['id']}] Found 37257825047@s.whatsapp.net in raw data!")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
