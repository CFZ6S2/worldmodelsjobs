import json
import os
import re

file_path = r'c:\Users\cesar\Documents\trae_projects\worldmodels\n8n\active\vps_buggy_safe.json'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Force active: true
content = re.sub(r'"active":\s*false', '"active":true', content)

# 2. Fix the specific broken JS snippet in Parse JSON1
# We need to make sure the quotes and backslashes are properly escaped for a JSON string.
broken_snippet = r'if (String(contact).includes(\'@g.us\') || String(contact).length > 20) { contact = "Desconocido"; } else if (/^\d{7,15}$/.test(String(contact))) { contact = \'+\' + contact; } \n\nlet parsed = {};'
# Note: the \n\n in the above line might be literal newlines in the file.

# Let's use a more robust regex to find and fix the block
# This block is inside "Parse JSON1"
# It currently looks like: ... contact = "Desconocido"; ... /^\d{7,15}$/ ...

# Replace unescaped "Desconocido"
content = content.replace('contact = "Desconocido"', 'contact = \\"Desconocido\\"')
# Replace unescaped backslashes in regex
content = content.replace(r'/^\d{7,15}$/', r'/^\\d{7,15}$/')

# Now the hardest part: literal newlines inside strings.
# We'll try to find any newline that is NOT followed by a JSON structure character.
# Actually, since it's n8n, let's just use a trick: 
# Most strings in n8n are either JS code or parameters.
# We'll try to join lines that don't look like the start of a new JSON property.

lines = content.splitlines()
fixed_lines = []
for i, line in enumerate(lines):
    if i == 0:
        fixed_lines.append(line)
        continue
    
    # If the previous line doesn't end with a character that typically ends a JSON line
    # (like , or { or [ or } or ]) AND this line doesn't start with a property name...
    # then it's probably a continuation of a string.
    prev = fixed_lines[-1].strip()
    curr = line.strip()
    
    if not (prev.endswith(',') or prev.endswith('{') or prev.endswith('[') or prev.endswith('}') or prev.endswith(']')):
        # Append as a escaped newline
        fixed_lines[-1] = fixed_lines[-1] + '\\n' + line
    else:
        fixed_lines.append(line)

final_content = "".join(fixed_lines)

# One more check: validate if it's now valid JSON
try:
    json_obj = json.loads(final_content)
    print("Success! JSON is now valid.")
    # Save it back as a single line or pretty-printed
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(json_obj, f, indent=None)
except json.JSONDecodeError as e:
    print(f"Still broken: {e}")
    # If still broken, let's try to just write a MINIMAL fixed version of the node
    # or just show where it's failing.
    print(f"Error at line {e.lineno}, col {e.colno}")
    snippet = final_content[max(0, e.pos-50):min(len(final_content), e.pos+50)]
    print(f"Context: ...{snippet}...")
