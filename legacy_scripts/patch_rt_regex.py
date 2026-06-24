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
        if node.get('name') == 'Message Router':
            code = node['parameters']['jsCode']
            
            # Replace the regex with one that supports accents
            new_regex = r"const russiaTurkeyRegex = /(rusia|russia|россия|mosc[uú]|moscow|москва|san petersburgo|saint petersburg|st petersburg|санкт-петербург|питер|kaz[aá]n|казань|sochi|сочи|vladivostok|владивосток|novosibirsk|новосибирск|ekaterimburgo|yekaterinburg|екатеринбург|bak[uú]|баку|tiflis|tbilisi|тбилиси|kiev|kyiv|киев|київ|киів|turqu[ií]a|turkey|türkiye|турция|estambul|istanbul|стамбул|ankara|анкара|antalya|анталья|анталия|izmir|esmirna|измир|bodrum|бодрум|bursa|бурса|capadocia|cappadocia|каппадокия)/i;"
            
            # Find the old regex and replace
            import re
            code = re.sub(r'const russiaTurkeyRegex = .*;', new_regex, code)
            
            node['parameters']['jsCode'] = code
            print("Patched Message Router regex for accents.")

    new_nodes_json = json.dumps(nodes)
    c.execute("UPDATE workflow_entity SET nodes = ? WHERE id = 'A0QpoDzX559wzRXQ'", (new_nodes_json,))
    conn.commit()
    conn.close()
    
    print("Successfully updated database.")

except Exception as e:
    print(f"Script Error: {e}")
