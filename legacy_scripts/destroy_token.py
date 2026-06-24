import os

target_dir = "/root/worldmodels-jobs"
bad_token = "DOcCr2pGzXM6hZgORbfo2YjdTWGRLH6eCP"
good_token = "shJOb5wskQMTyfoF20GLqmJOclA5if5j"

def scan_and_replace():
    for root, dirs, files in os.walk(target_dir):
        if 'node_modules' in root or '.git' in root:
            continue
        for file in files:
            if file.endswith('.js') or file.endswith('.env') or file.endswith('.json'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    if bad_token in content:
                        print(f"Found bad token in {path}, replacing...")
                        new_content = content.replace(bad_token, good_token)
                        with open(path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                except Exception as e:
                    pass

if __name__ == "__main__":
    scan_and_replace()
    print("Done scanning and replacing.")
