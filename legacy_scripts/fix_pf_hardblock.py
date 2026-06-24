import json
import subprocess

subprocess.run(["docker", "exec", "n8n", "n8n", "export:workflow", "--id=A0QpoDzX559wzRXQ", "--output=/tmp/wf_patch13.json"], check=True)
subprocess.run(["docker", "cp", "n8n:/tmp/wf_patch13.json", "/tmp/wf_patch13.json"], check=True)

with open('/tmp/wf_patch13.json', 'r') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

patched = False
for n in wf.get('nodes', []):
    if n['name'] == 'Pre-Filter Unified1':
        old_code = n['parameters']['jsCode']
        if 'miami' not in old_code:
            new_code = old_code.replace(
                'const HARD_BLOCK = new Set(["crypto", "binance", "casino", "usdt", "bitcoin", "wallet", "trading", "ganar dinero", "инди", "контент", "onlyfans", "вирт", "sugar baby", "sugar daddy", "anal", "masaje erotico", "ingles", "english"]);',
                'const HARD_BLOCK = new Set(["crypto", "binance", "casino", "usdt", "bitcoin", "wallet", "trading", "ganar dinero", "инди", "контент", "onlyfans", "вирт", "sugar baby", "sugar daddy", "anal", "masaje erotico", "ingles", "english", "israel", "tel aviv", "telaviv", "haifa", "jerusalem", "jerusalen", "miami", "usa", "u.s.a", "estados unidos", "united states", "los angeles", "new york", "las vegas", "boston", "chicago", "texas", "california", "florida", "orlando"]);'
            )
            n['parameters']['jsCode'] = new_code
            patched = True

if patched:
    with open('/tmp/wf_patch13_out.json', 'w') as f:
        json.dump(wf, f)
    subprocess.run(["docker", "cp", "/tmp/wf_patch13_out.json", "n8n:/tmp/wf_patch13_out.json"], check=True)
    subprocess.run(["docker", "exec", "n8n", "n8n", "import:workflow", "--input=/tmp/wf_patch13_out.json"], check=True)
    print("Fixed Pre-Filter Unified1 HARD_BLOCK")
else:
    print("Already patched or not found")
