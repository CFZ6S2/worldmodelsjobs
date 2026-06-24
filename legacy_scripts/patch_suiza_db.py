import sqlite3
import json
import re

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT id, nodes FROM workflow_entity WHERE active = 1")
row = c.fetchone()
if not row:
    print("No active workflow found")
    exit(1)

wf_id = row[0]
nodes = json.loads(row[1])

modified = False
for node in nodes:
    if node.get("name") == "Dynamic Routing Engine":
        js_code = node.get("parameters", {}).get("jsCode", "")
        if "suiza" in js_code:
            print("Suiza already in Dynamic Routing Engine!")
            continue
            
        # We need to insert the SUIZA block before the last }; of routingTable
        suiza_block = """,
  "suiza": {
    keywords: ["suiza", "switzerland", "zurich", "ginebra", "basilea", "berna", "lausana", "lugano", "lucerna", "schweiz", "suisse", "svizzera", "zurigo"],
    targets: [
      { to: "573183836809@s.whatsapp.net", label: "SUIZA" }
    ]
  }"""
        
        # Try to replace the end of the table
        match = re.search(r'(\}\s*\n\s*\};)', js_code)
        if match:
            new_code = js_code.replace(match.group(1), f"}}{suiza_block}\n}};", 1)
            node["parameters"]["jsCode"] = new_code
            modified = True
            print("Patched Dynamic Routing Engine using main regex")
        else:
            # Fallback for "monaco" format
            alt_match = re.search(r'("monaco"[\s\S]*?targets:\s*\[[\s\S]*?\]\s*\})', js_code)
            if alt_match:
                new_code = js_code.replace(alt_match.group(1), f"{alt_match.group(1)}{suiza_block}")
                node["parameters"]["jsCode"] = new_code
                modified = True
                print("Patched Dynamic Routing Engine using alt regex")
            else:
                # Fallback to appending right before the last }; 
                last_brace_match = re.search(r'(.*)(\}\s*\};)$', js_code, re.DOTALL)
                if last_brace_match:
                    new_code = last_brace_match.group(1) + "}" + suiza_block + "\n};"
                    node["parameters"]["jsCode"] = new_code
                    modified = True
                    print("Patched Dynamic Routing Engine using fallback regex")
                else:
                    print("Failed to find routingTable end")

if modified:
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = ?", (json.dumps(nodes), wf_id))
    conn.commit()
    print("Database patched successfully!")
else:
    print("No changes made.")

conn.close()
