import sys

with open('/root/worldmodels-jobs/server.js', 'r') as f:
    content = f.read()

target = """        console.error('❌ [JUANA ERROR]', {
            status: err.response?.status,
            data: err.response?.data,
            message: err.message
        });
        res.status(err.response?.status || 500).json({ error: "Failed to forward to Whapi (Juana)" });
    }
});"""

replacement = """        console.error('❌ [JUANA ERROR]', {
            status: err.response?.status,
            data: err.response?.data,
            message: err.message
        });
        // ALWAY RETURN 200 to n8n so it doesn't break the batch loop
        res.status(200).json({ error: "Failed to forward to Whapi", details: err.message });
    }
});"""

if target in content:
    new_content = content.replace(target, replacement)
    with open('/root/worldmodels-jobs/server.js', 'w') as f:
        f.write(new_content)
    print('PATCHED ERROR HANDLER')
else:
    print('NOT FOUND')
