import json
import sys

try:
    with open('c:\\Users\\cesar\\Documents\\trae_projects\\worldmodels\\n8n\\active\\vps_workflow_buggy.json', 'r', encoding='utf-16') as f:
        data = json.load(f)
    with open('c:\\Users\\cesar\\Documents\\trae_projects\\worldmodels\\n8n\\active\\vps_workflow_buggy_pretty.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print("Success")
except Exception as e:
    print(f"Error: {e}")
