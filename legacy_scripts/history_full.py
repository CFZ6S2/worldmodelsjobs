import sqlite3
import json

con = sqlite3.connect('/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite')
cur = con.cursor()
cur.execute("SELECT versionId, nodes FROM workflow_history WHERE workflowId='A0QpoDzX559wzRXQ' AND versionId='c2dc248b-f7b8-4d1d-a45a-fa15effaf4e3'")
row = cur.fetchone()
if row:
    nodes = json.loads(row[1])
    for n in nodes:
        if n.get('name') == 'Message Router':
            print(n.get('parameters', {}).get('jsCode', '[NO_JS_CODE]'))
            break
