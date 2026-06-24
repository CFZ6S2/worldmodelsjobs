import sqlite3
import json

db_path = "/root/database.sqlite"
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT connections FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
row = c.fetchone()
if not row:
    print("Workflow not found!")
    exit(1)

print(row[0])
conn.close()
