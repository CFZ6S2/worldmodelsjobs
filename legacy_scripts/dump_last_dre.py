import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("""
        SELECT id, data FROM execution_entity 
        ORDER BY id DESC LIMIT 20
    """)
    rows = c.fetchall()
    
    for row in rows:
        data = json.loads(row['data'])
        if 'Dynamic Routing Engine' in data.get('resultData', {}).get('runData', {}):
            dre = data['resultData']['runData']['Dynamic Routing Engine'][0]['data']['main'][0]
            if len(dre) > 0:
                dre_json = dre[0]['json']
                text = dre_json.get('texto_limpio', dre_json.get('text', dre_json.get('descripcion', '')))
                if 'Moscow' in text or 'Moscú' in text or 'rublos' in text:
                    print(f"--- Execution ID: {row['id']} ---")
                    print(f"Text: {text[:100]}...")
                    print(f"DRE Output: {dre_json.get('target_name')} -> {dre_json.get('final_target')}")
                    
                    if 'Parse JSON1' in data['resultData']['runData']:
                        parse = data['resultData']['runData']['Parse JSON1'][0]['data']['main'][0][0]['json']
                        print(f"Parse JSON1 Output: city={parse.get('city')}, category={parse.get('category')}")
                    break
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
