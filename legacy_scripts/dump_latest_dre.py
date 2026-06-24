import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("""
        SELECT e.id, d.data 
        FROM execution_entity e
        LEFT JOIN execution_data d ON e.id = d.executionId
        ORDER BY e.id DESC LIMIT 1
    """)
    
    row = c.fetchone()
    if row and row['data']:
        data = json.loads(row['data'])
        if "resultData" in data and "runData" in data["resultData"]:
            run_data = data["resultData"]["runData"]
            print(f"Execution {row['id']} runData keys: {list(run_data.keys())}")
            if "Dynamic Routing Engine" in run_data:
                dre = run_data["Dynamic Routing Engine"]
                if dre and len(dre) > 0 and "data" in dre[0] and "main" in dre[0]["data"]:
                    dre_out = dre[0]["data"]["main"][0]
                    if dre_out:
                        print("Dynamic Routing Engine OUTPUT:")
                        print(json.dumps(dre_out[0]["json"], indent=2))
                    else:
                        print("Dynamic Routing Engine output main is empty")
                else:
                    print("Dynamic Routing Engine error or missing data")
            else:
                print("Dynamic Routing Engine did not run in this execution")
                
            if "Parse JSON1" in run_data:
                print("\nParse JSON1 OUTPUT (leadData):")
                leadData = run_data["Parse JSON1"][0]["data"]["main"][0][0]["json"]
                print(json.dumps({k:v for k,v in leadData.items() if k in ['category', 'city', 'texto_limpio', 'text_es']}, indent=2))
                
        else:
            print("No resultData or runData")
    else:
        print("Execution data not found")
        
    conn.close()

except Exception as e:
    print(f"Script Error: {e}")
