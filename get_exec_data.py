import sqlite3
import json

db_path = "/root/database.sqlite"
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT id, data FROM execution_entity ORDER BY id DESC LIMIT 1")
row = c.fetchone()
if not row:
    print("No executions found!")
    exit(1)

print(f"Execution ID: {row[0]}")
data = json.loads(row[1])
result_data = data.get("resultData", {}).get("runData", {})

if 'Message Router' in result_data:
    print("\n--- Message Router Output ---")
    router_data = result_data['Message Router'][-1]['data']['main'][0]
    for i, item in enumerate(router_data):
        print(f"Item {i}:")
        print(json.dumps(item.get('json', {}), indent=2))
else:
    print("Message Router not found in runData")

if 'Telegram Fanout' in result_data:
    print("\n--- Telegram Fanout Error ---")
    print(json.dumps(result_data['Telegram Fanout'][-1].get('error', {}), indent=2))

conn.close()
