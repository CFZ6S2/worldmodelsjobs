import json
import os

messages_dir = r"c:\Users\cesar\Documents\trae_projects\worldmodels\web\source_from_vps\messages"
for filename in os.listdir(messages_dir):
    if filename.endswith(".json"):
        path = os.path.join(messages_dir, filename)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                json.load(f)
            print(f"OK: {filename}")
        except Exception as e:
            print(f"ERROR in {filename}: {e}")
