import urllib.request
import json
import subprocess

DEDUP_CODE = '''const results = [];
const store = $getWorkflowStaticData('global');
if (!store.history) store.history = [];

const now = Date.now();
const TTL = 5 * 60 * 1000;
store.history = store.history.filter(h => now - h.time < TTL);

for (const item of $input.all()) {
  const fp = String(item.json.texto_limpio || '').substring(0, 100);
  const sender = String(item.json.sender_contact || item.json.from || '');

  if (!store.history.some(h => h.fp === fp && h.sender === sender)) {
    store.history.push({ time: now, fp, sender });
    results.push({ json: item.json });
  }
}
return results;'''

# Export the current workflow via CLI
subprocess.run(["docker", "exec", "n8n", "n8n", "export:workflow", "--id=A0QpoDzX559wzRXQ", "--output=/tmp/wf_patch.json"], check=True)
subprocess.run(["docker", "cp", "n8n:/tmp/wf_patch.json", "/tmp/wf_patch.json"], check=True)

with open('/tmp/wf_patch.json', 'r') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

patched = False
for n in wf.get('nodes', []):
    if n['name'] == 'Dedup Hash1':
        n['parameters']['jsCode'] = DEDUP_CODE
        patched = True

if patched:
    with open('/tmp/wf_patch_out.json', 'w') as f:
        json.dump(wf, f)
    
    subprocess.run(["docker", "cp", "/tmp/wf_patch_out.json", "n8n:/tmp/wf_patch_out.json"], check=True)
    subprocess.run(["docker", "exec", "n8n", "n8n", "import:workflow", "--input=/tmp/wf_patch_out.json"], check=True)
    print("Patched Dedup Hash1 successfully via CLI")
else:
    print("Could not find Dedup Hash1 node")
