import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT nodes FROM workflow_entity WHERE active = 1")
row = c.fetchone()
if row:
    with open('/root/active_wf.json', 'w') as f:
        f.write(row[0])
conn.close()
