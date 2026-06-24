import json

with open('/tmp/current_wf.json') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

for n in wf.get('nodes', []):
    if n['name'] == 'Message Router':
        print(f"Message Router connections:")
        conns = wf.get('connections', {}).get('Message Router', {})
        print(json.dumps(conns, indent=2))
