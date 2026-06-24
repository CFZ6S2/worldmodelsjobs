import sqlite3
import json

db_path = '/var/lib/docker/volumes/worldmodels-jobs_n8n_data/_data/database.sqlite'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT nodes, connections FROM workflow_entity WHERE id = 'A0QpoDzX559wzRXQ'")
    row = c.fetchone()
    if row:
        nodes = json.loads(row['nodes'])
        connections = json.loads(row['connections'])
        
        print("=" * 80)
        print("ALL NODES IN WORKFLOW")
        print("=" * 80)
        for i, node in enumerate(nodes):
            name = node.get('name', 'UNKNOWN')
            ntype = node.get('type', 'UNKNOWN')
            disabled = node.get('disabled', False)
            print(f"\n[{i}] {name}")
            print(f"    Type: {ntype}")
            print(f"    Disabled: {disabled}")
            if 'jsCode' in node.get('parameters', {}):
                code = node['parameters']['jsCode']
                print(f"    JS Code ({len(code)} chars):")
                for line in code.strip().split('\n')[:5]:
                    print(f"      {line}")
                if len(code.strip().split('\n')) > 5:
                    print(f"      ... ({len(code.strip().split(chr(10)))} total lines)")
            elif 'conditions' in node.get('parameters', {}):
                print(f"    Conditions: {json.dumps(node['parameters']['conditions'], indent=2)[:500]}")
            elif 'functionCode' in node.get('parameters', {}):
                code = node['parameters']['functionCode']
                print(f"    Function Code ({len(code)} chars):")
                for line in code.strip().split('\n')[:5]:
                    print(f"      {line}")
        
        print("\n\n" + "=" * 80)
        print("CONNECTIONS")
        print("=" * 80)
        for source, targets in connections.items():
            if targets and targets.get('main'):
                for output_idx, output_targets in enumerate(targets['main']):
                    if output_targets:
                        for t in output_targets:
                            print(f"  {source} [output {output_idx}] --> {t['node']} [input {t.get('index', 0)}]")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
