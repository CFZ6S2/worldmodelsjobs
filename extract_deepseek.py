import sqlite3, json, sys

db_path = '/root/.n8n/database.sqlite'
id_to_check = 'n1DhoQWiUGezgX3b'

try:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT id, name, nodes FROM workflow_entity WHERE id = ? OR name LIKE '%DeepSeek%'", (id_to_check,))
    rows = c.fetchall()
    
    if not rows:
        print("No matching workflows found.")
    else:
        for row in rows:
            print(f"--- WORKFLOW {row[0]} | {row[1]} ---")
            print(row[2])
    conn.close()
except Exception as e:
    print(f"Error: {e}")
