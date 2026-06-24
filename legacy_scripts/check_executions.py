import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Check the last 10 executions - see which nodes ran in each
    c.execute("""
        SELECT e.id, e.startedAt, e.stoppedAt, ed.data 
        FROM execution_entity e 
        JOIN execution_data ed ON e.id = ed.executionId
        WHERE e.workflowId = 'A0QpoDzX559wzRXQ'
        ORDER BY e.id DESC LIMIT 10
    """)
    
    for row in c.fetchall():
        exec_id = row['id']
        data = json.loads(row['data'])
        
        # Find the mapping dict
        mapping = None
        for item in data:
            if isinstance(item, dict) and ('Pre-Filter Unified1' in item or 'Webhook WhatsApp' in item or 'Webhook Telegram' in item):
                mapping = item
                break
        
        nodes_ran = list(mapping.keys()) if mapping else []
        has_ia = 'IA Extract1' in nodes_ran
        has_prefilter = 'Pre-Filter Unified1' in nodes_ran
        has_dedup = 'Dedup Hash1' in nodes_ran
        
        print(f"Exec {exec_id}: IA={has_ia} | PreFilter={has_prefilter} | Dedup={has_dedup} | Nodes: {', '.join(sorted(nodes_ran))}")
    
    conn.close()
except Exception as e:
    print(f"Error: {e}")
