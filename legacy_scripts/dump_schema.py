import sqlite3

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='execution_entity'")
    print("execution_entity Schema:")
    print(c.fetchone()[0])

    c.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='execution_data'")
    row = c.fetchone()
    if row:
        print("\nexecution_data Schema:")
        print(row[0])
    else:
        print("\nexecution_data table does not exist")

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
