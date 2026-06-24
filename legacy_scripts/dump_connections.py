import json
with open('/root/worldmodels-jobs/patched_wf_final.json') as f:
    wf = json.load(f)
    print(json.dumps(wf.get('connections', {}), indent=2))
