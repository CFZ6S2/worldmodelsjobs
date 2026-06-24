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
        ORDER BY e.id DESC LIMIT 50
    """)

    for row in c.fetchall():
        data = row[2].lower()
        if 'tel aviv' in data or 'israel' in data:
            print(f"Match found in Execution {row[0]} at {row[1]}")
            # Find the text snippet
            idx = data.find('tel aviv')
            if idx == -1: idx = data.find('israel')
            if idx != -1:
                start = max(0, idx - 100)
                end = min(len(data), idx + 200)
                print(f"Snippet: {data[start:end]}")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
