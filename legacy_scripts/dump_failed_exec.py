import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT data FROM execution_data ORDER BY rowid DESC LIMIT 1")
    row = c.fetchone()
    
    data_str = row['data']
    if 'DEBUG DUMP' in data_str:
        idx = data_str.find('DEBUG DUMP: ')
        end_idx = data_str.find('"', idx)
        if end_idx == -1: end_idx = len(data_str)
        print(data_str[idx:end_idx].replace('\\"', '"'))
    else:
        print("DEBUG DUMP not found in last execution.")
    
    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
