import re

filepath = '/root/worldmodels-jobs/shared_bans.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

number_to_ban = '558396415629'

# Check if already banned
if f'"{number_to_ban}"' in content or f"'{number_to_ban}'" in content:
    print("Already banned")
else:
    # Find the BANNED_NUMBERS array
    # Replace the closing bracket of the array with the new number
    new_content = re.sub(
        r'(const BANNED_NUMBERS = \[)(.*?)(\];)',
        lambda m: m.group(1) + m.group(2) + (', ' if m.group(2).strip() else '') + f'"{number_to_ban}"' + m.group(3),
        content,
        flags=re.DOTALL
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Banned successfully")
