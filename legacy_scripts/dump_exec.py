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

data = json.loads(row[1])
result_data = data.get("resultData", {}).get("runData", {})

output = []
if 'Message Router' in result_data:
    router_data = result_data['Message Router'][-1]['data']['main'][0]
    output.append(f"Message Router Output:")
    for i, item in enumerate(router_data):
        output.append(f"Item {i}:")
        output.append(json.dumps(item.get('json', {}), indent=2))
else:
    output.append("Message Router not found in runData")

if 'Telegram Fanout' in result_data:
    output.append("\nTelegram Fanout Error:")
    output.append(json.dumps(result_data['Telegram Fanout'][-1].get('error', {}), indent=2))
    
    if 'data' in result_data['Telegram Fanout'][-1]:
        output.append("\nTelegram Fanout Input Data:")
        output.append(json.dumps(result_data['Telegram Fanout'][-1]['data'], indent=2))

with open("/root/exec_dump.txt", "w") as f:
    f.write("\n".join(output))

print("Dump written to /root/exec_dump.txt")
conn.close()
