import sqlite3
import json

db_path = '/root/.n8n/database.sqlite'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("""
    SELECT workflowId, count(*), max(stoppedAt) 
    FROM execution_entity 
    GROUP BY workflowId
""")
print("Executions by Workflow ID:")
for row in cur.fetchall():
    print(f"Workflow: {row[0]} | Executions: {row[1]} | Last Run: {row[2]}")
conn.close()
