import json
with open('/root/worldmodels-jobs/patched_wf_final.json') as f:
    wf = json.load(f)
    for node_name, conns in wf.get('connections', {}).items():
        if 'main' in conns:
            for arr in conns['main']:
                for target in arr:
                    if target['node'] == 'Global Alert Waiter':
                        print(f"Connected from: {node_name} TO Global Alert Waiter")
