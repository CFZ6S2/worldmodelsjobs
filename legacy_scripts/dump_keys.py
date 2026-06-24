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

    for row in c.fetchall():
        try:
            d = json.loads(row[1])
            run_data = d.get('resultData', {}).get('runData', {})
            nodes = list(run_data.keys())
            if 'Message Router' in nodes:
                print(f"Execution {row[0]}: Reached Message Router!")
                # Print the trash status
                if 'Parse JSON1' in run_data:
                    pj = run_data['Parse JSON1'][0]['data']['main'][0][0]['json']
                    print(f"  Category: {pj.get('category')} | Trash: {pj.get('trash')}")
                # Print output length of Telegram Fanout
                if 'Telegram Fanout' in run_data:
                    tf = run_data['Telegram Fanout'][0]['data'].get('main', [[]])[0]
                    print(f"  Fanout items: {len(tf)}")
        except Exception as e:
            pass

    conn.close()
except Exception as e:
    print(f"Error: {e}")
