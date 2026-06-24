import sqlite3

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute("""
        SELECT e.id, e.startedAt, e.stoppedAt, e.status
        FROM execution_entity e
        WHERE e.workflowId = 'A0QpoDzX559wzRXQ'
        ORDER BY e.id DESC LIMIT 20
    """)
    for row in c.fetchall():
        print(row)
    conn.close()

except Exception as e:
    print(f"Error: {e}")
