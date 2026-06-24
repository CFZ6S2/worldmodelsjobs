import json
import subprocess

subprocess.run(["docker", "exec", "n8n", "n8n", "export:workflow", "--id=A0QpoDzX559wzRXQ", "--output=/tmp/wf_patch11.json"], check=True)
subprocess.run(["docker", "cp", "n8n:/tmp/wf_patch11.json", "/tmp/wf_patch11.json"], check=True)

with open('/tmp/wf_patch11.json', 'r') as f:
    wf = json.load(f)

if isinstance(wf, list):
    wf = wf[0]

patched = False
for n in wf.get('nodes', []):
    if n['name'] == 'Extract Metadata WA1':
        old_code = n['parameters'].get('jsCode', '')
        if 'msg.text.body' not in old_code:
            insertion = '''
if (!textBody && body.messages && Array.isArray(body.messages) && body.messages.length > 0) {
  const msg = body.messages[0];
  if (msg.text && typeof msg.text.body === 'string') {
    textBody = msg.text.body;
  } else if (msg.message && msg.message.extendedTextMessage && typeof msg.message.extendedTextMessage.text === 'string') {
    textBody = msg.message.extendedTextMessage.text;
  } else if (msg.message && typeof msg.message.conversation === 'string') {
    textBody = msg.message.conversation;
  }
}
'''
            new_code = old_code.replace('textBody = textBody.replace(/\\*/g, \'\').replace(/_/g, \'\').trim();', insertion + '\ntextBody = textBody.replace(/\\*/g, \'\').replace(/_/g, \'\').trim();')
            n['parameters']['jsCode'] = new_code
            patched = True

if patched:
    with open('/tmp/wf_patch11_out.json', 'w') as f:
        json.dump(wf, f)
    subprocess.run(["docker", "cp", "/tmp/wf_patch11_out.json", "n8n:/tmp/wf_patch11_out.json"], check=True)
    subprocess.run(["docker", "exec", "n8n", "n8n", "import:workflow", "--input=/tmp/wf_patch11_out.json"], check=True)
    print("Fixed Extract Metadata WA1 text extraction")
else:
    print("Already patched or not found")
