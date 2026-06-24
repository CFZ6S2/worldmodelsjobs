import sqlite3

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT id, name, active FROM workflow_entity WHERE id='A0QpoDzX559wzRXQ'")
row = c.fetchone()
print(f"Workflow: {row[1]}, Active: {row[2]}")

if row[2] != 1:
    c.execute("UPDATE workflow_entity SET active=1 WHERE id='A0QpoDzX559wzRXQ'")
    conn.commit()
    print("REACTIVATED!")
else:
    print("Already active")

conn.close()
