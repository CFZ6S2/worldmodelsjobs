import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Get the latest execution
    c.execute("""
        SELECT id, data FROM execution_entity 
        ORDER BY id DESC LIMIT 5
    """)
    rows = c.fetchall()
    
    for row in rows:
        data = json.loads(row['data'])
        # Find start node payload
        try:
            start_data = data['resultData']['runData']['Webhook Telegram1'][0]['data']['main'][0][0]['json']
            text = start_data.get('texto_limpio', start_data.get('text', ''))
            
            if '90,000' in text or 'Moscow' in text or 'Moscú' in text:
                print(f"--- Execution ID: {row['id']} ---")
                
                # Check Parse JSON
                if 'Parse JSON1' in data['resultData']['runData']:
                    parse = data['resultData']['runData']['Parse JSON1'][0]['data']['main'][0][0]['json']
                    print(f"Parse JSON1 Output: city={parse.get('city')}, category={parse.get('category')}")
                
                # Check Dynamic Routing
                if 'Dynamic Routing Engine' in data['resultData']['runData']:
                    dre = data['resultData']['runData']['Dynamic Routing Engine'][0]['data']['main'][0]
                    if len(dre) > 0:
                        dre_json = dre[0]['json']
                        print(f"DRE Output: target_name={dre_json.get('target_name')}, final_target={dre_json.get('final_target')}")
                    else:
                        print("DRE returned nothing")
        except Exception as ex:
            pass
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
