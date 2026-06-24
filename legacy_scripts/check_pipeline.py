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
        ORDER BY e.id DESC LIMIT 500
    """)

    stats = {
        "total": 0,
        "reached_prefilter": 0,
        "passed_prefilter": 0,
        "passed_dedup": 0,
        "passed_ai": 0,
        "passed_guard": 0
    }

    for row in c.fetchall():
        try:
            d = json.loads(row[1])
            run_data = d.get('resultData', {}).get('runData', {})
            nodes = list(run_data.keys())
            
            if 'Webhook' in nodes or 'Telegram Webhook' in nodes:
                stats["total"] += 1
            if 'Pre-Filter Unified1' in nodes:
                stats["reached_prefilter"] += 1
                # Check if it outputted items
                if run_data['Pre-Filter Unified1'][0].get('data', {}).get('main', [[]])[0]:
                    stats["passed_prefilter"] += 1
            if 'Dedup Hash1' in nodes:
                if run_data['Dedup Hash1'][0].get('data', {}).get('main', [[]])[0]:
                    stats["passed_dedup"] += 1
            if 'Parse JSON1' in nodes:
                stats["passed_ai"] += 1
            if 'Message Router' in nodes:
                stats["passed_guard"] += 1
                
        except Exception as e:
            pass

    conn.close()
    
    print("\\n=== EXECUTION PIPELINE (Last 500 Executions) ===")
    for k, v in stats.items():
        print(f"{k}: {v}")

except Exception as e:
    print(f"Error: {e}")
