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
        ORDER BY e.id DESC LIMIT 100
    """)

    stats = {
        "total": 0,
        "blocked_prefilter": 0,
        "blocked_dedup": 0,
        "blocked_trash": 0,
        "passed": 0
    }

    for row in c.fetchall():
        data = row[1]
        stats["total"] += 1
        
        if '"Pre-Filter Unified1":' in data:
            if '"Dedup Hash1":' not in data:
                stats["blocked_prefilter"] += 1
            else:
                if '"IA Extract1":' not in data and '"Parse JSON1":' not in data:
                    stats["blocked_dedup"] += 1
                else:
                    if '"Message Router":' not in data:
                        stats["blocked_trash"] += 1
                    else:
                        stats["passed"] += 1

    conn.close()
    
    print("\\n=== EXECUTION PATH ANALYSIS (Last 100 Executions) ===")
    for k, v in stats.items():
        print(f"{k}: {v}")

except Exception as e:
    print(f"Error: {e}")
