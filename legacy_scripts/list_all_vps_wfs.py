import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT id, name, active FROM workflow_entity")
for row in cur.fetchall():
    print(row)
conn.close()
