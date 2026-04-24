import sqlite3
import os

db_path = 'c:/Users/cesar/Documents/trae_projects/worldmodels/n8n_prod.sqlite'

if not os.path.exists(db_path):
    print(f"Error: {db_path} no existe")
    exit(1)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [t[0] for t in cur.fetchall()]
    print("Tablas encontradas:")
    for t in tables:
        print(f"- {t}")
        # Get columns for each table
        cur.execute(f"PRAGMA table_info({t})")
        cols = [c[1] for c in cur.fetchall()]
        print(f"  Columnas: {', '.join(cols)}")

except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
