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
        ORDER BY e.id DESC LIMIT 200
    """)

    stats = {
        "total": 0,
        "reached_prefilter": 0,
        "passed_prefilter": 0,
        "passed_dedup": 0,
        "passed_ai": 0,
        "passed_guard": 0
    }

    blocked_by_prefilter_reasons = []
    blocked_by_guard_reasons = []

    for row in c.fetchall():
        try:
            d = json.loads(row[1])
            root = d[0]
            if "resultData" not in root: continue
            
            res_data_idx = int(root["resultData"])
            res_data = d[res_data_idx]
            
            if "runData" not in res_data: continue
            run_data_idx = int(res_data["runData"])
            run_data = d[run_data_idx]
            
            nodes = list(run_data.keys())
            
            if 'Webhook' in nodes or 'Telegram Webhook' in nodes or 'Webhook WhatsApp' in nodes:
                stats["total"] += 1
            if 'Pre-Filter Unified1' in nodes:
                stats["reached_prefilter"] += 1
                
                # Check if it passed Pre-Filter
                pre_runs_idx = int(run_data['Pre-Filter Unified1'])
                pre_runs = d[pre_runs_idx]
                pre_run = d[int(pre_runs[0])]
                
                def unflat(idx, depth=0):
                    if depth > 20: return idx
                    if isinstance(idx, str) and idx.isdigit():
                        val = d[int(idx)]
                        if isinstance(val, dict): return {k: unflat(v, depth+1) for k, v in val.items()}
                        if isinstance(val, list): return [unflat(v, depth+1) for v in val]
                        return val
                    return idx

                pre_out = unflat(pre_run.get('data', {}))
                passed = False
                if 'main' in pre_out and pre_out['main'] and pre_out['main'][0]:
                    passed = True
                
                if passed:
                    stats["passed_prefilter"] += 1
                else:
                    # Look for input text to see why it was blocked
                    if 'Webhook WhatsApp' in nodes:
                        wa_runs = d[int(run_data['Webhook WhatsApp'])]
                        wa_run = d[int(wa_runs[0])]
                        wa_out = unflat(wa_run.get('data', {}))
                        try:
                            j = wa_out['main'][0][0]['json']
                            text = j.get('body', {}).get('message', {}).get('extendedTextMessage', {}).get('text') or j.get('body', {}).get('message', {}).get('conversation') or ""
                            if len(text) > 5:
                                blocked_by_prefilter_reasons.append(text)
                        except: pass
                    
            if 'Dedup Hash1' in nodes:
                stats["passed_dedup"] += 1
            if 'Parse JSON1' in nodes:
                stats["passed_ai"] += 1
            if 'Message Router' in nodes or 'Dynamic Routing Engine' in nodes:
                stats["passed_guard"] += 1
            elif 'Final Guard1' in nodes and 'Message Router' not in nodes and 'Dynamic Routing Engine' not in nodes:
                # Blocked by Final Guard!
                fg_runs = d[int(run_data['Final Guard1'])]
                fg_run = d[int(fg_runs[0])]
                fg_out = unflat(fg_run.get('data', {}))
                
                pj_runs = d[int(run_data['Parse JSON1'])]
                pj_run = d[int(pj_runs[0])]
                pj_out = unflat(pj_run.get('data', {}))
                try:
                    cat = pj_out['main'][0][0]['json']['category']
                    blocked_by_guard_reasons.append(cat)
                except:
                    pass

        except Exception as e:
            pass

    conn.close()
    
    print("\\n=== EXECUTION PIPELINE (Last 200 Executions) ===")
    for k, v in stats.items():
        print(f"{k}: {v}")

    print(f"\\nBlocked by PreFilter texts ({len(blocked_by_prefilter_reasons)}):")
    for t in blocked_by_prefilter_reasons[:5]:
        print(f" - {t[:100]!r}")
        
    print(f"\\nBlocked by AI Final Guard categories ({len(blocked_by_guard_reasons)}):")
    from collections import Counter
    print(Counter(blocked_by_guard_reasons))

except Exception as e:
    print(f"Error: {e}")
