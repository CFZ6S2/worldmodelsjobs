import sqlite3
import json

con = sqlite3.connect('/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite')
cur = con.cursor()
cur.execute("SELECT versionId, nodes FROM workflow_history WHERE workflowId='A0QpoDzX559wzRXQ' ORDER BY createdAt DESC LIMIT 10")
rows = cur.fetchall()
for row in rows:
    vid, nodes_str = row
    nodes = json.loads(nodes_str)
    router_code = "NOT_FOUND"
    for n in nodes:
        if n.get('name') == 'Message Router':
            router_code = n.get('parameters', {}).get('jsCode', '[NO_JS_CODE]')
            break
    print(f"Version {vid}: {repr(router_code[:100])}")
