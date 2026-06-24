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
        ORDER BY e.id DESC LIMIT 5
    """)

    for row in c.fetchall():
        try:
            d = json.loads(row[1])
            nodes = [item for item in d if isinstance(item, dict)]
            if nodes:
                print(f"Execution {row[0]}: Nodes executed = {list(nodes[0].keys())}")
        except Exception as e:
            pass

    conn.close()
except Exception as e:
    print(f"Error: {e}")
