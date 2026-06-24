import json

with open('/tmp/wf_patch8_out.json', 'r') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

# Check connections of Parse JSON1
conns = wf.get('connections', {})
parse_conns = conns.get('Parse JSON1', {})
print("Connections FROM Parse JSON1:")
print(json.dumps(parse_conns, indent=2))
