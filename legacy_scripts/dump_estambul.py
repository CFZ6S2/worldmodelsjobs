import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("""
        SELECT executionId as id, data FROM execution_data 
        ORDER BY executionId DESC LIMIT 30
    """)
    rows = c.fetchall()
    
    found = False
    for row in rows:
        data = json.loads(row['data'])
        
        # Look for 'Estambul' or 'Istanbul' in Webhook Telegram data
        start_node_data = ""
        try:
            start_data = data['resultData']['runData']['Webhook Telegram1'][0]['data']['main'][0][0]['json']
            start_node_data = str(start_data).lower()
        except Exception:
            pass
            
        if 'estambul' in start_node_data or 'istanbul' in start_node_data:
            print(f"--- Execution ID: {row['id']} ---")
            found = True
            
            if 'Pre-Filter Unified1' in data['resultData']['runData']:
                pre = data['resultData']['runData']['Pre-Filter Unified1'][0]['data']['main']
                if not pre or len(pre[0]) == 0:
                    print("BLOCKED by Pre-Filter")
                    continue
                else:
                    print("Passed Pre-Filter")
            
            if 'Dynamic Routing Engine' in data['resultData']['runData']:
                dre = data['resultData']['runData']['Dynamic Routing Engine'][0]['data']['main'][0]
                if len(dre) > 0:
                    dre_json = dre[0]['json']
                    print(f"DRE Output Target: {dre_json.get('target_wa')}")
                    print(f"DRE Output City: {dre_json.get('city')}")
                    print(f"Raw Text seen by DRE: {dre_json.get('texto_limpio', dre_json.get('text', dre_json.get('descripcion', '')))[:150]}")
                else:
                    print("DRE returned nothing")
            break
            
    if not found:
        print("No Estambul lead found in the last 30 executions.")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
