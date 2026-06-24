import sqlite3

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute("""
        SELECT e.id, e.startedAt
        FROM execution_entity e
        WHERE e.workflowId = 'A0QpoDzX559wzRXQ'
        ORDER BY e.id DESC LIMIT 500
    """)
    rows = c.fetchall()
    print(f"Latest execution: {rows[0][0]} at {rows[0][1]}")
    print(f"Oldest execution: {rows[-1][0]} at {rows[-1][1]}")

    conn.close()

except Exception as e:
    print(f"Error: {e}")
