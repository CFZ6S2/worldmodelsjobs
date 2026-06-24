import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT id, nodes FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    nodes = json.loads(row['nodes'])
    
    for node in nodes:
        if node['name'] == 'Pre-Filter Unified1':
            js_code = node['parameters']['jsCode']
            # Surgical fix: Make HARD_BLOCK check for substrings instead of exact matches
            js_code = js_code.replace(
                "else if (HARD_BLOCK.has(text)) rejectReason = \"hard_block_match\";",
                "else if ([...HARD_BLOCK].some(k => text.includes(k))) rejectReason = \"hard_block_match\";"
            )
            node['parameters']['jsCode'] = js_code

        if node['name'] == 'Dynamic Routing Engine':
            js_code = node['parameters']['jsCode']
            # Surgical fix 1: Normalize accents in rawText
            js_code = js_code.replace(
                "const rawText = (leadData.texto_limpio || leadData.text_es || leadData.descripcion || \"\").toLowerCase();",
                "const rawText = String(leadData.texto_limpio || leadData.text_es || leadData.descripcion || \"\").toLowerCase().normalize(\"NFD\").replace(/[\\u0300-\\u036f]/g, \"\");"
            )
            # Surgical fix 2: Do not route to Global group if no client matches
            js_code = js_code.replace(
                "let matchedTargetName = \"Global\";\nlet finalTarget = globalGroup;",
                "let matchedTargetName = null;\nlet finalTarget = null;"
            )
            if "return [{ json: { ...leadData" in js_code:
                # We need to return [] if finalTarget is null
                js_code = js_code.replace(
                    "return [{ json: { ...leadData",
                    "if (!finalTarget) return [];\n\nreturn [{ json: { ...leadData"
                )
            node['parameters']['jsCode'] = js_code

    new_nodes = json.dumps(nodes)
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_nodes,))
    conn.commit()
    print("Surgical patches applied successfully!")
    conn.close()

except Exception as e:
    print(f"Error: {e}")
