import sqlite3
import json
import os

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
if not os.path.exists(db_path):
    print(f"Error: {db_path} does not exist!")
    exit(1)

conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT id, name, active FROM workflow_entity")
print("=== Workflows in Docker SQLite ===")
for r in cur.fetchall():
    print(f"ID: {r[0]} | Name: {r[1]} | Active: {r[2]}")

cur.execute("SELECT id, name, type FROM credentials_entity")
print("\n=== Credentials in Docker SQLite ===")
for r in cur.fetchall():
    print(f"ID: {r[0]} | Name: {r[1]} | Type: {r[2]}")

conn.close()
