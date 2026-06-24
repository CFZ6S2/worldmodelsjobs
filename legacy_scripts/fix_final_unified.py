import json
import subprocess
import os

# Create a clean patch script that modifies all nodes perfectly
def apply_patch():
    try:
        subprocess.run(["docker", "exec", "n8n", "n8n", "export:workflow", "--id=A0QpoDzX559wzRXQ", "--output=/tmp/wf_final.json"], check=True)
        subprocess.run(["docker", "cp", "n8n:/tmp/wf_final.json", "/tmp/wf_final.json"], check=True)
    except Exception as e:
        print(f"Error exporting workflow: {e}")
        return

    with open('/tmp/wf_final.json', 'r') as f:
        wf = json.load(f)

    if isinstance(wf, list):
        wf = wf[0]

    for n in wf.get('nodes', []):
        if n['name'] == 'Parse JSON1':
            old_code = n['parameters']['jsCode']
            # Ensure original_text is passed
            if 'original_text: originalText' not in old_code:
                new_code = old_code.replace("trash: parsed.trash === true || (parsed.category === 'trash' && !isJobish) || false\n};", "trash: parsed.trash === true || (parsed.category === 'trash' && !isJobish) || false,\n  original_text: originalText\n};")
                # Fallback if the previous replace didn't work exactly
                if "original_text: originalText" not in new_code:
                    new_code = old_code.replace("trash: parsed.trash === true || (parsed.category === 'trash' && !isJobish) || false", "trash: parsed.trash === true || (parsed.category === 'trash' && !isJobish) || false,\n  original_text: originalText")
                n['parameters']['jsCode'] = new_code

        elif n['name'] == 'Dynamic Routing Engine':
            old_code = n['parameters']['jsCode']
            # 1. Remove russia_turkey from routingTable so it correctly falls back to Global RU group
            if '"russia_turkey":' in old_code:
                import re
                new_code = re.sub(r'"russia_turkey"\s*:\s*\{[^}]*targets\s*:\s*\[\]\s*\},?', '', old_code)
            else:
                new_code = old_code
            
            # 2. Check original_text to capture Cyrillic
            if 'const textRaw = String($json.text_es || "").toLowerCase().trim();' in new_code:
                new_code = new_code.replace('const textRaw = String($json.text_es || "").toLowerCase().trim();', 'const textRaw = String(($json.text_es || "") + " " + ($json.original_text || "")).toLowerCase().trim();')
            n['parameters']['jsCode'] = new_code

        elif n['name'] == 'Message Router':
            old_code = n['parameters']['jsCode']
            # Check original_text to capture Cyrillic for Telegram
            if 'const textRaw = String($json.text_es || "").toLowerCase().trim();' in old_code:
                new_code = old_code.replace('const textRaw = String($json.text_es || "").toLowerCase().trim();', 'const textRaw = String(($json.text_es || "") + " " + ($json.original_text || "")).toLowerCase().trim();')
                n['parameters']['jsCode'] = new_code

    with open('/tmp/wf_final_out.json', 'w') as f:
        json.dump(wf, f)
        
    try:
        subprocess.run(["docker", "cp", "/tmp/wf_final_out.json", "n8n:/tmp/wf_final_out.json"], check=True)
        subprocess.run(["docker", "exec", "n8n", "n8n", "import:workflow", "--input=/tmp/wf_final_out.json"], check=True)
        print("Successfully updated the workflow.")
    except Exception as e:
        print(f"Error importing workflow: {e}")

if __name__ == '__main__':
    apply_patch()
