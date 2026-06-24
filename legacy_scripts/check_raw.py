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
        ORDER BY e.id DESC LIMIT 1
    """)

    for row in c.fetchall():
        print(f"Execution {row[0]}")
        print(row[1][:500]) # Print first 500 characters of raw data

    conn.close()
except Exception as e:
    print(f"Error: {e}")
