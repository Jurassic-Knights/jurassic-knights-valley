#!/usr/bin/env python3
"""
Fix audit issues in entity JSON files:
1. Add bodyType to human entities (default 'medium')
2. Add tier to nodes (derive from ID)
3. Add tier to equipment (derive from ID)
"""

import json
import re
from pathlib import Path

ENTITIES = Path(__file__).parent.parent / "src" / "entities"

def derive_tier(entity_id):
    """Extract tier from entity ID pattern like 'node_t2_01' -> 2"""
    match = re.search(r'_t(\d)_', entity_id)
    return int(match.group(1)) if match else 1

def fix_entity(file_path, fixes_applied):
    """Apply fixes to a single entity JSON file."""
    with open(file_path, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
    
    modified = False
    entity_id = data.get('id', file_path.stem)
    
    # Fix 1: Add bodyType to humans
    if data.get('sourceFile') == 'human' and 'bodyType' not in data:
        data['bodyType'] = 'medium'
        fixes_applied['bodyType'] += 1
        modified = True
        print(f"  Added bodyType='medium' to {entity_id}")
    
    # Fix 2 & 3: Add tier to nodes/equipment
    if 'tier' not in data:
        tier = derive_tier(entity_id)
        data['tier'] = tier
        fixes_applied['tier'] += 1
        modified = True
        print(f"  Added tier={tier} to {entity_id}")
    
    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
    
    return modified

def main():
    fixes_applied = {'bodyType': 0, 'tier': 0}
    total_fixed = 0
    
    # Fix human enemies
    print("\n=== Fixing Human Enemies ===")
    enemies_dir = ENTITIES / "enemies"
    if enemies_dir.exists():
        for file in sorted(enemies_dir.glob("enemy_human_*.json")):
            if fix_entity(file, fixes_applied):
                total_fixed += 1
    
    # Fix human bosses
    print("\n=== Fixing Human Bosses ===")
    bosses_dir = ENTITIES / "bosses"
    if bosses_dir.exists():
        for file in sorted(bosses_dir.glob("boss_human_*.json")):
            if fix_entity(file, fixes_applied):
                total_fixed += 1
    
    # Fix nodes (add tier)
    print("\n=== Fixing Nodes ===")
    nodes_dir = ENTITIES / "nodes"
    if nodes_dir.exists():
        for file in sorted(nodes_dir.glob("*.json")):
            if fix_entity(file, fixes_applied):
                total_fixed += 1
    
    # Fix equipment (add tier)
    print("\n=== Fixing Equipment ===")
    equipment_dir = ENTITIES / "equipment"
    if equipment_dir.exists():
        for file in sorted(equipment_dir.glob("*.json")):
            if fix_entity(file, fixes_applied):
                total_fixed += 1
    
    print(f"\n=== SUMMARY ===")
    print(f"  Added bodyType: {fixes_applied['bodyType']}")
    print(f"  Added tier: {fixes_applied['tier']}")
    print(f"  Total files fixed: {total_fixed}")

if __name__ == "__main__":
    main()
