import sqlite3
import json

db_path = '/root/.n8n/database.sqlite'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT nodes, connections FROM workflow_entity WHERE id='NO7NLZ5Kccp6jrOS'")
row = cur.fetchone()
if row:
    nodes = json.loads(row[0])
    connections = json.loads(row[1])
    # Print all Langchain nodes
    for n in nodes:
        if 'langchain' in n.get('type','').lower():
            print(f"Langchain Node: {n.get('name')} | Type: {n.get('type')}")
            if 'credentials' in n:
                print(f"  Credentials: {n['credentials']}")
            else:
                print("  No credentials")
    
    # Print connections involving Message a model
    print("\nConnections involving Message a model:")
    print(json.dumps(connections.get("Message a model", {}), indent=2))
conn.close()
