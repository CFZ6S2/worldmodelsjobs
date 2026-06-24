import json
import subprocess
import os

def apply_patch():
    try:
        subprocess.run(["docker", "exec", "n8n", "n8n", "export:workflow", "--id=A0QpoDzX559wzRXQ", "--output=/tmp/wf_wa.json"], check=True)
        subprocess.run(["docker", "cp", "n8n:/tmp/wf_wa.json", "/tmp/wf_wa.json"], check=True)
    except Exception as e:
        print(f"Error exporting workflow: {e}")
        return

    with open('/tmp/wf_wa.json', 'r') as f:
        wf = json.load(f)

    if isinstance(wf, list):
        wf = wf[0]

    patched = False
    for n in wf.get('nodes', []):
        if n['name'] == 'Extract Metadata WA1':
            old_code = n['parameters']['jsCode']
            
            # Fix text extraction
            if 'body.messages[0].text.body' not in old_code:
                new_code = old_code.replace("let textBody = '';", "let textBody = '';\nif (body.messages && body.messages.length > 0 && body.messages[0].text && typeof body.messages[0].text.body === 'string') {\n  textBody = body.messages[0].text.body;\n}")
            else:
                new_code = old_code
                
            # Fix getPhone backslash bug
            if '/\\\\D/g' in new_code:
                new_code = new_code.replace('/\\\\D/g', '/\\D/g')
            
            # Fix json stringify in DWA!
            if n['name'] == 'Dynamic WhatsApp Alert':
                old_code = n['parameters']['jsonBody']
                if '={{ JSON.stringify(' in old_code:
                    new_code = old_code.replace('={{ JSON.stringify((() => {', '={{ ((() => {')
                    new_code = new_code.replace('})()) }}', '})() }}')
                    n['parameters']['jsonBody'] = new_code

            n['parameters']['jsCode'] = new_code
            patched = True

    # Check DWA node separately
    for n in wf.get('nodes', []):
        if n['name'] == 'Dynamic WhatsApp Alert':
            old_code = n['parameters']['jsonBody']
            if '={{ JSON.stringify(' in old_code:
                new_code = old_code.replace('={{ JSON.stringify((() => {', '={{ ((() => {')
                new_code = new_code.replace('})()) }}', '})() }}')
                n['parameters']['jsonBody'] = new_code
                patched = True

    if patched:
        with open('/tmp/wf_wa_out.json', 'w') as f:
            json.dump(wf, f)
            
        try:
            subprocess.run(["docker", "cp", "/tmp/wf_wa_out.json", "n8n:/tmp/wf_wa_out.json"], check=True)
            subprocess.run(["docker", "exec", "n8n", "n8n", "import:workflow", "--input=/tmp/wf_wa_out.json"], check=True)
            print("Successfully updated the workflow.")
        except Exception as e:
            print(f"Error importing workflow: {e}")

if __name__ == '__main__':
    apply_patch()
