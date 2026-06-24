import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, status, createdAt FROM execution_entity ORDER BY id DESC LIMIT 200;")
    rows = c.fetchall()
    
    # In sqlite, we can't easily search inside JSON columns across thousands of rows without full-text search,
    # but since it's a small DB, we can just do a LIKE query!
    c.execute("SELECT id, data FROM execution_entity WHERE data LIKE '%57825047%' ORDER BY id DESC LIMIT 5;")
    matches = c.fetchall()
    
    if len(matches) == 0:
        print("Number 57825047 NOT FOUND in recent N8N executions!")
    else:
        for row in matches:
            print(f"FOUND in execution {row['id']}")
            # Find the chatId in the execution data
            data_str = row['data']
            # Very hacky way to find the string that looks like an ID
            import re
            jids = re.findall(r'37257825047[^"\'\\s]*', data_str)
            if jids:
                print("Extracted JIDs:", set(jids))
            
    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
