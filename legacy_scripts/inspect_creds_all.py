import sqlite3
import json

db_path = '/root/.n8n/database.sqlite'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT id, name, type FROM credentials_entity")
rows = cur.fetchall()
print(f"Total credentials: {len(rows)}")
for r in rows:
    print(r)
conn.close()
