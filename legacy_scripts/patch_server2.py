import sys
import re

try:
    with open('/root/worldmodels-jobs/server.js', 'r') as f:
        content = f.read()

    # The broken line is: console.log(" 👤 [ADMIN] Updating user :, updateData);
    # Or: console.log(👤 [ADMIN] Updating user :, updateData);
    
    # We will regex replace any line containing "Updating user :, updateData" 
    # with the correct console.log
    content = re.sub(r'console\.log\(.*?Updating user :, updateData\);', 'console.log("👤 [ADMIN] Updating user :", updateData);', content)
    
    with open('/root/worldmodels-jobs/server.js', 'w') as f:
        f.write(content)
        
    print("Patched successfully")
except Exception as e:
    print(f"Error: {e}")
