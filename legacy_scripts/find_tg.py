import sqlite3

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute("""
        SELECT e.id, e.startedAt, ed.data
        FROM execution_entity e
        JOIN execution_data ed ON e.id = ed.executionId
        WHERE e.workflowId = 'A0QpoDzX559wzRXQ'
        ORDER BY e.id DESC LIMIT 500
    """)

    for row in c.fetchall():
        if 'Webhook Telegram' in row[2] or 'Telegram Webhook' in row[2]:
            print(f"Telegram execution found: {row[0]} at {row[1]}")
            break

    conn.close()
except Exception as e:
    print(f"Error: {e}")
