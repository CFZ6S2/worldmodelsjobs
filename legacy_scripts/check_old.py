import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("""
        SELECT ed.data
        FROM execution_entity e
        JOIN execution_data ed ON e.id = ed.executionId
        WHERE e.workflowId = 'A0QpoDzX559wzRXQ'
        ORDER BY e.id ASC LIMIT 1
    """)
    row = c.fetchone()
    if row:
        data = json.loads(row[0])
        print("Got oldest execution data")
        # Find Message Router code if it was saved in the execution data
        # Execution data usually contains node data.
    conn.close()
except Exception as e:
    print(f"Error: {e}")
