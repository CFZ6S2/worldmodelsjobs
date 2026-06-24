import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, status, waitTill, data FROM execution_entity WHERE status = 'waiting' ORDER BY id DESC LIMIT 5;")
    rows = c.fetchall()
    for row in rows:
        print(f"ID: {row['id']}")
        print(f"WaitTill: {row['waitTill']}")
        data = json.loads(row['data'])
        try:
            # Try to print the route_lang or target_wa to see which ones are stuck
            wa_target = data['executionData']['contextData']['node']['Dynamic Routing Engine']['data']['main'][0][0]['json']['target_wa']
            city_label = data['executionData']['contextData']['node']['Dynamic Routing Engine']['data']['main'][0][0]['json']['city_label']
            print(f"Waiting for: {city_label} -> {wa_target}")
        except:
            print("Could not extract routing data from execution JSON.")
        print("-" * 20)

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
