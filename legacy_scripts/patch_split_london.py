import sqlite3
import json
import re

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT id, nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
row = c.fetchone()
wf_id = row[0]
nodes = json.loads(row[1])

modified = False
for node in nodes:
    if node.get("name") == "Message Router":
        js_code = node.get("parameters", {}).get("jsCode", "")
        # Remove WA target from Message Router to satisfy user request
        if "wa: '447838757923@s.whatsapp.net', " in js_code:
            new_code = js_code.replace("wa: '447838757923@s.whatsapp.net', ", "")
            node["parameters"]["jsCode"] = new_code
            modified = True
            
    if node.get("name") == "Dynamic Routing Engine":
        js_code = node.get("parameters", {}).get("jsCode", "")
        if "london" not in js_code:
            london_block = """,
  "london": {
    keywords: ["london", "londres", "mayfair", "soho", "chelsea", "uk", "england", "inglaterra"],
    targets: [
      { to: "447838757923@s.whatsapp.net", label: "LONDON", categoryFilter: "evento" }
    ]
  }"""
            match = re.search(r'(\}\s*\n\s*\};)', js_code)
            if match:
                node["parameters"]["jsCode"] = js_code.replace(match.group(1), f"}}{london_block}\n}};", 1)
                modified = True
            else:
                # Fallback for "monaco" format
                alt_match = re.search(r'("monaco"[\s\S]*?targets:\s*\[[\s\S]*?\]\s*\})', js_code)
                if alt_match:
                    new_code = js_code.replace(alt_match.group(1), f"{alt_match.group(1)}{london_block}")
                    node["parameters"]["jsCode"] = new_code
                    modified = True

    if node.get("name") == "Dynamic WhatsApp Alert":
        js_code = node.get("parameters", {}).get("jsonBody", "")
        if "LONDON ALERT" not in js_code:
            london_format = """
  else if (label === 'LONDON') {
    return { "to": target, "body": "*📢 LONDON ALERT*\\n📍 *" + ($json.city || "Unknown") + "* | 💰 *" + ($json.budget || "Negotiable") + "*\\n\\n" + ($json.text_en || $json.text_es || "No description") + "\\n\\n👤 *Contact:* " + ($json.contact || "Unknown") + "\\n🔌 *Source:* " + ($json.platform || "WhatsApp") };
  }"""
            new_code = js_code.replace("else {", london_format + "\n  else {")
            node["parameters"]["jsonBody"] = new_code
            modified = True

if modified:
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = ?", (json.dumps(nodes), wf_id))
    conn.commit()
    print("Database split successfully!")
else:
    print("No changes made.")

conn.close()
