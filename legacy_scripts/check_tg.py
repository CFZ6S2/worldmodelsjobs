import json

with open('/tmp/current_wf.json') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

for n in wf.get('nodes', []):
    if n['name'] == 'Telegram Fanout':
        print("Telegram Fanout Configuration:")
        print(json.dumps(n, indent=2))
