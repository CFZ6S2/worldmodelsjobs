import json
import sys

try:
    with open("nodes.json", "r", encoding="utf-8") as f:
        nodes = json.load(f)
    for node in nodes:
        if node.get("name") == "Dynamic WhatsApp Alert":
            print(json.dumps(node, indent=2))
            sys.exit(0)
    print("Node not found.")
except Exception as e:
    print(f"Error: {e}")
