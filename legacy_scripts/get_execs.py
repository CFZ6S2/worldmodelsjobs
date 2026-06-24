import sqlite3
import json

db_path = "/root/database.sqlite"
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT status, error, data FROM execution_entity ORDER BY id DESC LIMIT 5")
rows = c.fetchall()
for row in rows:
    print(f"Status: {row[0]}")
    if row[1]:
        print(f"Error: {row[1]}")

conn.close()
