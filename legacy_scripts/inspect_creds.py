import sqlite3
import json

db_path = '/root/.n8n/database.sqlite'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT id, name, type FROM credentials_entity")
for row in cur.fetchall():
    print(f"ID: {row[0]} | Name: {row[1]} | Type: {row[2]}")
conn.close()
