import sqlite3
import json

db_path = '/root/.n8n/database.sqlite'

def dump_table(c, table_name):
    try:
        c.execute(f'SELECT * FROM "{table_name}" LIMIT 50;')
        cols = [description[0] for description in c.description]
        rows = c.fetchall()
        print(f"\n--- TABLE: {table_name} ---")
        print(f"Columns: {cols}")
        for row in rows:
            print(row)
    except Exception as e:
        print(f"Error dumping {table_name}: {e}")

try:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    c.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in c.fetchall()]
    print(f"Available tables: {tables}")
    
    target_tables = ['user', 'user_entity', 'workflow_entity', 'project', 'project_entity', 'shared_workflow']
    for table in target_tables:
        if table in tables:
            dump_table(c, table)
        else:
            # Try case insensitive or plural if standard fails
            pass
            
except Exception as e:
    print(f"Global Error: {e}")
finally:
    if 'conn' in locals():
        conn.close()
