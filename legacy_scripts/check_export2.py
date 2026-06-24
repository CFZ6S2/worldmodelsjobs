import json

with open("/tmp/current_wf.json") as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

for n in wf["nodes"]:
    name = n["name"]
    if name in ["Extract Metadata WA1", "Pre-Filter Unified1", "Dedup Hash1"]:
        code = n["parameters"].get("jsCode", "")
        print(f"{name}:")
        print(f"  has 'return []': {'return []' in code}")  
        print(f"  has 'continue': {'continue' in code}")
        print(f"  code[:150]: {code[:150]}")
        print()
