import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    if not row:
        print("Workflow not found!")
        exit(1)

    nodes = json.loads(row['nodes'])
    updated = False

    for node in nodes:
        if node.get('name') == 'Dynamic Routing Engine':
            js_code = node.get('parameters', {}).get('jsCode', '')
            
            old_city_check = "if (cityDetected.includes(key)) {"
            new_city_check = "if (cityDetected.includes(key) || config.keywords.some(kw => cityDetected.includes(kw))) {"
            
            if old_city_check in js_code:
                js_code = js_code.replace(old_city_check, new_city_check)
                node['parameters']['jsCode'] = js_code
                updated = True
                print("Patched Dynamic Routing Engine city check")

    if updated:
        c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (json.dumps(nodes),))
        conn.commit()
        print("Database updated successfully!")
    else:
        print("No changes made.")

    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
