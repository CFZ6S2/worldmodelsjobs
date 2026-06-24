import re

server_js_path = "/root/worldmodels-jobs/server.js"
try:
    with open(server_js_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # We need to replace:
    # headers: { 'Authorization': `Bearer ${JUANA_TOKEN}` }
    # with:
    # headers: { 'Authorization': `Bearer ${process.env.WHAPI_TOKEN || 'DOcCr2pGzXM6hZgORbfo2YjdTWGRLH6eCP'}` }
    
    content = content.replace(
        "headers: { 'Authorization': `Bearer ${JUANA_TOKEN}` }",
        "headers: { 'Authorization': `Bearer ${process.env.WHAPI_TOKEN || 'DOcCr2pGzXM6hZgORbfo2YjdTWGRLH6eCP'}` }"
    )
    
    # Just in case, also replace it in checkSystemHealth if it exists
    content = content.replace(
        "headers: { 'Authorization': `Bearer shJOb5wskQMTyfoF20GLqmJOclA5if5j` }",
        "headers: { 'Authorization': `Bearer ${process.env.WHAPI_TOKEN || 'DOcCr2pGzXM6hZgORbfo2YjdTWGRLH6eCP'}` }"
    )

    with open(server_js_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print("Successfully patched server.js again!")

except Exception as e:
    print(f"Error: {e}")
