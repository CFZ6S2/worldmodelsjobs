import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

HARD_BLOCK = {"crypto", "binance", "casino", "usdt", "bitcoin", "wallet", "trading", "ganar dinero", 
  "инди", "контент", "onlyfans", "вирт", "sugar baby", "sugar daddy", "anal", "masaje erotico", 
  "ingles", "english", "israel", "tel aviv", "telaviv", "haifa", "jerusalem", "jerusalen",
  "miami", "usa", "u.s.a", "estados unidos", "united states", "los angeles", "new york", "las vegas"}

BANNED_PREFIXES = ["58", "57", "92", "91", "62", "244", "972"]

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("""
        SELECT e.id, e.startedAt, ed.data
        FROM execution_entity e
        JOIN execution_data ed ON e.id = ed.executionId
        WHERE e.workflowId = 'A0QpoDzX559wzRXQ'
        ORDER BY e.id DESC LIMIT 100
    """)

    total_leads = 0
    discarded_pre_filter = 0
    discarded_trash = 0
    passed = 0
    
    pre_filter_reasons = {}

    for row in c.fetchall():
        data = json.loads(row['data'])
        
        def unflat(idx, depth=0):
            if depth > 20: return idx
            if isinstance(idx, str) and idx.isdigit():
                val = data[int(idx)]
                if isinstance(val, dict): return {k: unflat(v, depth+1) for k, v in val.items()}
                if isinstance(val, list): return [unflat(v, depth+1) for v in val]
                return val
            return idx
        
        mapping = None
        for item in data:
            if isinstance(item, dict) and ('Webhook' in item or 'Telegram Webhook' in item):
                mapping = item
                break
        
        if not mapping: continue
        
        # Determine if it's WA or TG
        node_name = 'Webhook' if 'Webhook' in mapping else 'Telegram Webhook'
        idx = mapping.get(node_name)
        if not idx: continue
        
        total_leads += 1
        runs = data[int(idx)]
        run = data[int(runs[0])]
        
        text = ""
        sender = ""
        if 'data' in run:
            out = unflat(run['data'])
            if 'main' in out and out['main'] and out['main'][0]:
                j = out['main'][0][0].get('json', {})
                if node_name == 'Webhook':
                    # WA logic to get text manually for testing
                    try:
                        text = j.get('body', {}).get('message', {}).get('extendedTextMessage', {}).get('text') or j.get('body', {}).get('message', {}).get('conversation') or ""
                        sender = j.get('body', {}).get('key', {}).get('remoteJid', '')
                    except:
                        pass
                else:
                    text = j.get('body', {}).get('message', {}).get('text', '')
                    sender = str(j.get('body', {}).get('message', {}).get('from', {}).get('id', ''))

        # Clean sender
        import re
        sender = re.sub(r'\\D', '', sender)
        
        # Check if passed Pre-Filter
        if 'Pre-Filter Unified1' in mapping:
            pre_idx = mapping['Pre-Filter Unified1']
            pre_runs = data[int(pre_idx)]
            pre_run = data[int(pre_runs[0])]
            
            # If Pre-filter returned empty, it was blocked
            pre_out = unflat(pre_run.get('data', {}))
            if 'main' in pre_out and pre_out['main'] and pre_out['main'][0]:
                # Passed pre-filter
                pass
            else:
                discarded_pre_filter += 1
                reason = "Unknown"
                text_lower = text.lower()
                for p in BANNED_PREFIXES:
                    if sender.startswith(p):
                        reason = f"Banned Prefix: {p}"
                        break
                if reason == "Unknown":
                    for hw in HARD_BLOCK:
                        if hw in text_lower:
                            reason = f"Banned Word: {hw}"
                            break
                if reason == "Unknown":
                    if len(text) < 10:
                        reason = "Too Short / Empty"
                pre_filter_reasons[reason] = pre_filter_reasons.get(reason, 0) + 1
                continue
                
        # Check if passed Final Guard
        if 'Final Guard1' in mapping:
            fg_idx = mapping['Final Guard1']
            fg_runs = data[int(fg_idx)]
            fg_run = data[int(fg_runs[0])]
            fg_out = unflat(fg_run.get('data', {}))
            if 'main' in fg_out and fg_out['main'] and fg_out['main'][0]:
                passed += 1
            else:
                discarded_trash += 1
                print(f"TRASH DISCARDED: {text[:100]}...")

    conn.close()
    
    print("\\n=== ANALISIS DE LOS ULTIMOS 100 LEADS ===")
    print(f"Total procesados: {total_leads}")
    print(f"Pasaron y se enviaron: {passed} ({passed/total_leads*100:.1f}%)")
    print(f"Descartados por Pre-Filtro (países/palabras clave): {discarded_pre_filter}")
    for r, c in pre_filter_reasons.items():
        print(f"   - {r}: {c}")
    print(f"Descartados por la IA (Basura / Trash): {discarded_trash}")

except Exception as e:
    print(f"Error: {e}")
