import sqlite3

db_path = 'n8n_prod.sqlite'

try:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in c.fetchall()]
    print(f"All tables: {tables}")
    for table in tables:
        c.execute(f"SELECT COUNT(*) FROM \"{table}\"")
        count = c.fetchone()[0]
        print(f"Table: {table}, Rows: {count}")
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals():
        conn.close()
