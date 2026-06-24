import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("""
        SELECT executionId as id, data FROM execution_data 
        ORDER BY executionId DESC LIMIT 10
    """)
    rows = c.fetchall()
    
    for row in rows:
        data = json.loads(row['data'])
        
        start_node_data = ""
        try:
            start_data = data['resultData']['runData']['Webhook Telegram1'][0]['data']['main'][0][0]['json']
            text_es = start_data.get('text_es', '')
            texto_limpio = start_data.get('texto_limpio', '')
            text = start_data.get('text', '')
            city = start_data.get('city', '')
            print(f"[{row['id']}] City: {city} | Text (truncated): {str(texto_limpio or text_es or text)[:50]}")
        except Exception:
            print(f"[{row['id']}] Error parsing lead")
            
    conn.close()
except Exception as e:
    print(f"Error: {e}")
