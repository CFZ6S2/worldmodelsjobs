import sqlite3

db_path = '/root/.n8n/database.sqlite'

def list_all():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, active FROM workflow_entity')
    rows = cursor.fetchall()
    print("Workflows in Database:")
    for r in rows:
        print(f"ID: {r[0]} | Name: {r[1]} | Active: {r[2]}")
    conn.close()

if __name__ == '__main__':
    list_all()
