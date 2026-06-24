import json

with open('/tmp/current_wf.json') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

connections = wf.get('connections', {})

for source_node, targets in connections.items():
    if source_node in ['Quality Score', 'Dynamic Routing Engine', 'Message Router']:
        print(f"{source_node} connects to:")
        main_targets = targets.get('main', [])
        for branch_idx, target_list in enumerate(main_targets):
            if target_list:
                for target in target_list:
                    print(f"  Branch {branch_idx} -> {target['node']}")
