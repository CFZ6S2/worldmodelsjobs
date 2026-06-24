import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute("""
        SELECT e.id, ed.data
        FROM execution_entity e
        JOIN execution_data ed ON e.id = ed.executionId
        WHERE e.workflowId = 'A0QpoDzX559wzRXQ'
        ORDER BY e.id DESC LIMIT 50
    """)

    total_leads = 0
    passed_pre_filter = 0
    passed_final_guard = 0
    passed_fanout = 0

    for row in c.fetchall():
        data = row[1]
        if 'Webhook' in data or 'Telegram Webhook' in data:
            total_leads += 1
        
        if '"Pre-Filter Unified1":' in data:
            # Check if it returned items
            idx = data.find('"Pre-Filter Unified1":')
            # Very rough estimate: if Parse JSON1 is present, it passed pre-filter
            if '"Parse JSON1":' in data:
                passed_pre_filter += 1
                
                # If Final Guard passed, Message Router is present
                if '"Message Router":' in data:
                    passed_final_guard += 1
                    
                    if '"Telegram Fanout":' in data:
                        passed_fanout += 1

    conn.close()
    
    print(f"Total Leads (last 50 executions): {total_leads}")
    print(f"Passed Pre-Filter (Not Banned/Short): {passed_pre_filter}")
    print(f"Passed Final Guard (Not Trash): {passed_final_guard}")
    print(f"Reached Telegram Fanout: {passed_fanout}")

except Exception as e:
    print(f"Error: {e}")
