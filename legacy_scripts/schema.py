import sqlite3

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("PRAGMA table_info(execution_entity)")
for row in c.fetchall():
    print(row)

conn.close()
