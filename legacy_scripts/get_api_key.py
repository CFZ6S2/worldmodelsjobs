import sqlite3
import json
import subprocess

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

# Get API key from n8n
result = subprocess.run(
    ["docker", "exec", "n8n", "n8n", "user-management:create-api-key", "--id", "1"],
    capture_output=True, text=True, timeout=15
)
print(f"Create API key result: {result.stdout.strip()} | {result.stderr.strip()}")

# Try to get existing API key from database
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Check for API keys in the database
for table in ['user', 'user_api_keys']:
    try:
        c.execute(f"SELECT * FROM {table}")
        cols = [d[0] for d in c.description]
        rows = c.fetchall()
        print(f"\nTable {table}: cols={cols}")
        for row in rows:
            print(f"  {dict(zip(cols, row))}")
    except Exception as e:
        print(f"Table {table}: {e}")

conn.close()
