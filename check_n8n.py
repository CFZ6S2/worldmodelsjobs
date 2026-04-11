import sqlite3
import os

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

if not os.path.exists(db_path):
    print(f'ERROR: {db_path} not found.')
    exit(1)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Get all tables
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cur.fetchall()]
print(f'Tables: {tables}')

for t in [tb for tb in tables if 'workflow' in tb or 'entity' in tb]:
    cur.execute(f"PRAGMA table_info({t})")
    cols = [r[1] for r in cur.fetchall()]
    cur.execute(f"SELECT count(*) FROM {t}")
    count = cur.fetchone()[0]
    print(f'Table {t}: {count} records. Columns: {cols}')
    
    if count > 0:
        cur.execute(f"SELECT * FROM {t} LIMIT 1")
        sample = cur.fetchone()
        print(f'Sample from {t}: {sample}')

conn.close()
