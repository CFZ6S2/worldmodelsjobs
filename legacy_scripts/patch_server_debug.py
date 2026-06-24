import re

file_path = '/root/worldmodels-jobs/worldmodels-backend/server.js'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Let's add a console.log right before axios.post to whapi
old_code = r'''        const humanText = humanizeMessage\(messageText\);

        const response = await axios\.post\('https://gate\.whapi\.cloud/messages/text', {'''

new_code = '''        const humanText = humanizeMessage(messageText);
        console.log(`🚀 [JUANA DEBUG] Sending to target: "${targetChat}" (length: ${targetChat.length})`);

        const response = await axios.post('https://gate.whapi.cloud/messages/text', {'''

code = re.sub(old_code, new_code, code)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Patched server.js for debug logging.")
