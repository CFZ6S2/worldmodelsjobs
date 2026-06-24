import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute("""
        SELECT e.id, ed.data
        FROM execution_entity e
        JOIN execution_data ed ON e.id = ed.executionId
        WHERE e.workflowId = 'A0QpoDzX559wzRXQ'
        ORDER BY e.id DESC LIMIT 100
    """)

    found = False
    for row in c.fetchall():
        data = row[1]
        if '"Message Router":' in data:
            print(f"Execution {row[0]} reached Message Router!")
            found = True
            break
            
    if not found:
        print("No execution reached Message Router in the last 100.")
        
    conn.close()

except Exception as e:
    print(f"Error: {e}")
