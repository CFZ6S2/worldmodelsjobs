import sys

with open('/root/worldmodels-jobs/server.js', 'r') as f:
    content = f.read()

target = 'if (!targetChat || !messageText) {\n        return res.status(400).json({ error: "Missing to or body" });\n    }'
replacement = 'if (!targetChat) {\n        console.log("⏩ [JUANA SKIPPED] No targetChat provided.");\n        return res.status(200).json({ skipped: true });\n    }\n    if (!messageText) {\n        return res.status(400).json({ error: "Missing body" });\n    }'

if target in content:
    new_content = content.replace(target, replacement)
    with open('/root/worldmodels-jobs/server.js', 'w') as f:
        f.write(new_content)
    print('PATCHED')
else:
    print('NOT FOUND')
