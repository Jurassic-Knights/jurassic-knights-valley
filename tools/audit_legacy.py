"""
Audit script to find inconsistencies between:
- tools/ (legacy, deprecated)
- src/entities/ (source of truth)

Checks:
1. Status mismatches
2. Missing sourceDescription in src/entities
3. Fields present in tools/ but not in src/entities/
4. Entities in tools/ but not in src/entities/
"""
import json
import os
import glob

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTITIES_DIR = os.path.join(BASE_DIR, 'src', 'entities')
TOOLS_DIR = os.path.join(BASE_DIR, 'tools')

def load_tools_enemies():
    """Load all enemies from tools/enemies/*.json"""
    enemies = {}
    enemies_dir = os.path.join(TOOLS_DIR, 'enemies')
    if not os.path.isdir(enemies_dir):
        return enemies
    
    for jf in glob.glob(os.path.join(enemies_dir, '*.json')):
        with open(jf, encoding='utf-8') as f:
            try:
                data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        enemies[item['id']] = {
                            'data': item,
                            'source': os.path.basename(jf)
                        }
            except:
                pass
    return enemies

def load_src_entities():
    """Load all entities from src/entities/enemies/*.json"""
    entities = {}
    enemies_dir = os.path.join(ENTITIES_DIR, 'enemies')
    if not os.path.isdir(enemies_dir):
        return entities
    
    for jf in glob.glob(os.path.join(enemies_dir, '*.json')):
        with open(jf, encoding='utf-8') as f:
            try:
                data = json.load(f)
                # The ID in src/entities is prefixed with enemy_
                entity_id = data.get('id', '')
                # Map to tools ID (without enemy_ prefix for comparison)
                tools_id = entity_id.replace('enemy_', '')
                entities[tools_id] = {
                    'data': data,
                    'source': os.path.basename(jf),
                    'original_id': entity_id
                }
            except Exception as e:
                print(f"Error loading {jf}: {e}")
    return entities

def main():
    print("=" * 60)
    print("LEGACY TOOLS vs SRC/ENTITIES AUDIT")
    print("=" * 60)
    print()
    
    tools_enemies = load_tools_enemies()
    src_entities = load_src_entities()
    
    print(f"Found {len(tools_enemies)} enemies in tools/enemies/")
    print(f"Found {len(src_entities)} entities in src/entities/enemies/")
    print()
    
    # 1. Status mismatches
    print("=" * 60)
    print("1. STATUS MISMATCHES")
    print("=" * 60)
    status_mismatches = []
    for tools_id, tools_info in tools_enemies.items():
        if tools_id in src_entities:
            tools_status = tools_info['data'].get('status', 'pending')
            src_status = src_entities[tools_id]['data'].get('status', 'pending')
            if tools_status != src_status:
                status_mismatches.append({
                    'id': tools_id,
                    'tools_status': tools_status,
                    'src_status': src_status
                })
    
    if status_mismatches:
        for m in status_mismatches:
            print(f"  {m['id']}: tools={m['tools_status']} vs src={m['src_status']}")
    else:
        print("  No status mismatches found")
    print(f"Total: {len(status_mismatches)}")
    print()
    
    # 2. Missing sourceDescription in src/entities
    print("=" * 60)
    print("2. MISSING sourceDescription IN src/entities")
    print("=" * 60)
    missing_desc = []
    for tools_id, src_info in src_entities.items():
        if 'sourceDescription' not in src_info['data']:
            # Check if tools has it
            tools_desc = None
            if tools_id in tools_enemies:
                tools_desc = tools_enemies[tools_id]['data'].get('sourceDescription')
            missing_desc.append({
                'id': tools_id,
                'original_id': src_info['original_id'],
                'tools_has': tools_desc is not None,
                'tools_desc': tools_desc
            })
    
    if missing_desc:
        for m in missing_desc:
            has_in_tools = "YES (can copy)" if m['tools_has'] else "NO"
            print(f"  {m['original_id']}: tools has sourceDescription: {has_in_tools}")
    else:
        print("  All entities have sourceDescription")
    print(f"Total: {len(missing_desc)}")
    print()
    
    # 3. Entities in tools but not in src/entities
    print("=" * 60)
    print("3. ENTITIES IN TOOLS BUT NOT IN src/entities")
    print("=" * 60)
    tools_only = []
    for tools_id, tools_info in tools_enemies.items():
        if tools_id not in src_entities:
            tools_only.append({
                'id': tools_id,
                'name': tools_info['data'].get('name', ''),
                'source': tools_info['source']
            })
    
    if tools_only:
        for t in tools_only:
            print(f"  {t['id']} ({t['name']}) - from {t['source']}")
    else:
        print("  All tools entities have src/entities equivalents")
    print(f"Total: {len(tools_only)}")
    print()
    
    # 4. Entities in src/entities but not in tools
    print("=" * 60)
    print("4. ENTITIES IN src/entities BUT NOT IN tools")
    print("=" * 60)
    src_only = []
    for tools_id, src_info in src_entities.items():
        if tools_id not in tools_enemies:
            src_only.append({
                'id': tools_id,
                'original_id': src_info['original_id'],
                'name': src_info['data'].get('name', '')
            })
    
    if src_only:
        for s in src_only:
            print(f"  {s['original_id']} ({s['name']})")
    else:
        print("  All src/entities have tools equivalents")
    print(f"Total: {len(src_only)}")
    print()
    
    # Summary
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    total_issues = len(status_mismatches) + len(missing_desc) + len(tools_only)
    print(f"Status mismatches: {len(status_mismatches)}")
    print(f"Missing sourceDescription: {len(missing_desc)}")
    print(f"Tools-only entities: {len(tools_only)}")
    print(f"Src-only entities: {len(src_only)}")
    print(f"TOTAL ISSUES: {total_issues}")

if __name__ == "__main__":
    main()
