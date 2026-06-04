import sqlite3
import json
import re

db_path = "/root/database.sqlite"
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT id, nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
row = c.fetchone()
if not row:
    print("Workflow not found!")
    exit(1)

nodes_str = row[1]
nodes = json.loads(nodes_str)

found = False
for node in nodes:
    if node.get("name") == "Message Router":
        js_code = node.get("parameters", {}).get("jsCode", "")
        # Remove old matching
        old_code_1 = """const monacoKws = ["monaco", "cannes", "niza", "nice", "monte carlo", "côte d'azur"];
if (monacoKws.some(kw => cityRaw.includes(kw) || textRaw.includes(kw))) {"""
        new_code_1 = """const monacoRegex = /\\b(monaco|cannes|niza|monte carlo|côte d'azur)\\b/i;
// Match 'nice' ONLY as a city or if it has #nice (to avoid 'nice girl' false positives)
if (monacoRegex.test(cityRaw) || monacoRegex.test(textRaw) || cityRaw === 'nice' || textRaw.includes('#nice')) {"""
        
        if old_code_1 in js_code:
            node["parameters"]["jsCode"] = js_code.replace(old_code_1, new_code_1)
            found = True

    if node.get("name") == "Dynamic Routing Engine":
        js_code = node.get("parameters", {}).get("jsCode", "")
        old_code_2 = """for (const [key, config] of Object.entries(routingTable)) {
    if (config.keywords.some(kw => textNorm.includes(kw) || cityNorm.includes(kw))) {
         matchedTargets = [...matchedTargets, ...config.targets];
    }
}"""
        new_code_2 = """for (const [key, config] of Object.entries(routingTable)) {
    const pattern = new RegExp(`\\\\b(${config.keywords.join('|')})\\\\b`, 'i');
    if (pattern.test(textNorm) || pattern.test(cityNorm)) {
         matchedTargets = [...matchedTargets, ...config.targets];
    }
}"""
        if old_code_2 in js_code:
            node["parameters"]["jsCode"] = js_code.replace(old_code_2, new_code_2)
            found = True

if found:
    new_nodes_str = json.dumps(nodes)
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_nodes_str,))
    conn.commit()
    print("Database patched successfully!")
else:
    print("Node or code not found to patch!")

conn.close()
