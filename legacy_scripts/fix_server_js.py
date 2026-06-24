import re

server_js_path = "/root/worldmodels-jobs/server.js"
try:
    with open(server_js_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Let's see how I modified it and restore it
    # Currently it has:
    # const JUANA_TOKEN = process.env.JUANA_API_TOKEN || process.env.WHAPI_TOKEN || 'shJOb5wskQMTyfoF20GLqmJOclA5if5j';
    
    # We will modify the Juana route to use WHAPI_TOKEN for outbound
    new_route_logic = """
app.post('/api/juana/send', async (req, res) => {
    // 1. Authenticate incoming request using JUANA_API_TOKEN
    const authHeader = req.headers.authorization;
    const expectedIncomingToken = process.env.JUANA_API_TOKEN || 'shJOb5wskQMTyfoF20GLqmJOclA5if5j';
    
    if (!authHeader || authHeader !== `Bearer ${expectedIncomingToken}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { to, body } = req.body;
    if (!to || !body) {
        return res.status(400).json({ error: 'Missing to or body' });
    }

    const targets = Array.isArray(to) ? to : [to];
    console.log(`📡 [JUANA INCOMING] Request received at ${new Date().toISOString()}`);

    const outboundToken = process.env.WHAPI_TOKEN || 'DOcCr2pGzXM6hZgORbfo2YjdTWGRLH6eCP';
    const JUANA_URL = process.env.WHAPI_API_URL || 'https://gate.whapi.cloud/messages/text';

    // Anti-ban global queue logic remains the same (just ensuring we use outboundToken)
    // Actually, let's just replace the exact Axios call in the loop if possible
"""

    # I'll just search and replace the Axios call and JUANA_TOKEN at the top.
    
    # Remove the global const JUANA_TOKEN
    content = re.sub(r"const JUANA_TOKEN = process\.env\.JUANA_API_TOKEN \|\| process\.env\.WHAPI_TOKEN \|\| 'shJOb5wskQMTyfoF20GLqmJOclA5if5j';\n", "", content)
    
    # Fix the route auth check
    content = content.replace(
        "if (!authHeader || authHeader !== `Bearer ${JUANA_TOKEN}`)",
        "const expectedIncomingToken = process.env.JUANA_API_TOKEN || 'shJOb5wskQMTyfoF20GLqmJOclA5if5j';\n    if (!authHeader || authHeader !== `Bearer ${expectedIncomingToken}`)"
    )
    
    # Fix the axios call token
    content = content.replace(
        "'Authorization': `Bearer ${JUANA_TOKEN}`,",
        "'Authorization': `Bearer ${process.env.WHAPI_TOKEN || 'DOcCr2pGzXM6hZgORbfo2YjdTWGRLH6eCP'}`, /* FIXED OUTBOUND TOKEN */"
    )

    with open(server_js_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print("Successfully patched server.js!")

except Exception as e:
    print(f"Error: {e}")
