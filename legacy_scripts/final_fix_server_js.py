import os
import subprocess

env_path = "/root/worldmodels-jobs/.env"
server_path = "/root/worldmodels-jobs/server.js"

# 1. Fix .env
try:
    with open(env_path, "r") as f:
        env_lines = f.readlines()
        
    with open(env_path, "w") as f:
        for line in env_lines:
            if line.startswith("WHAPI_TOKEN="):
                f.write("WHAPI_TOKEN=shJOb5wskQMTyfoF20GLqmJOclA5if5j\n")
            elif line.startswith("JUANA_API_TOKEN="):
                f.write("JUANA_API_TOKEN=shJOb5wskQMTyfoF20GLqmJOclA5if5j\n")
            else:
                f.write(line)
    print("Fixed .env")
except Exception as e:
    print("Error fixing .env:", e)

# 2. Fix server.js
try:
    with open(server_path, "r") as f:
        server_content = f.read()
        
    # Replace inbound check
    server_content = server_content.replace(
        "const expectedIncomingToken = process.env.JUANA_API_TOKEN || 'shJOb5wskQMTyfoF20GLqmJOclA5if5j';",
        "const expectedIncomingToken = process.env.JUANA_API_TOKEN || 'shJOb5wskQMTyfoF20GLqmJOclA5if5j';"
    ) # it's actually correct already if it uses shJ...
    
    # Replace outbound header
    server_content = server_content.replace(
        "'Authorization': `Bearer ${process.env.WHAPI_TOKEN || 'DOcCr2pGzXM6hZgORbfo2YjdTWGRLH6eCP'}`",
        "'Authorization': `Bearer ${process.env.WHAPI_TOKEN || 'shJOb5wskQMTyfoF20GLqmJOclA5if5j'}`"
    )
    
    with open(server_path, "w") as f:
        f.write(server_content)
    print("Fixed server.js")
    
    # Restart PM2
    subprocess.run(["pm2", "restart", "worldmodels-backend", "--update-env"])
    print("Restarted PM2")
except Exception as e:
    print("Error fixing server.js:", e)
