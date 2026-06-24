import json

wf = json.load(open("/tmp/current_wf.json"))
print(f"Nodes: {len(wf.get('nodes', []))}")
for n in wf.get('nodes', []):
    name = n['name']
    if name in ['Extract Metadata WA1', 'Pre-Filter Unified1', 'Dedup Hash1']:
        code = n['parameters'].get('jsCode', '')
        has_return_empty = 'return []' in code
        has_continue = 'continue' in code
        print(f"\n{name}:")
        print(f"  Has 'return []': {has_return_empty}")
        print(f"  Has 'continue': {has_continue}")
        print(f"  First 120 chars: {code[:120]}")
