import sqlite3

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, status, stoppedAt FROM execution_entity WHERE stoppedAt LIKE '2026-06-23 06:57:%' OR stoppedAt LIKE '2026-06-23 06:58:%'")
    rows = c.fetchall()
    
    for row in rows:
        print(f"Execution {row['id']} - Status: {row['status']} - StoppedAt: {row['stoppedAt']}")

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
