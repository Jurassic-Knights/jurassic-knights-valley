"""
Convert JSON entity files to TypeScript modules
Transforms: { "id": "x", ... } → export default { id: "x", ... } satisfies EntityType;
"""

import os
import json
from pathlib import Path

SRC_DIR = Path(__file__).parent.parent / "src"
ENTITIES_DIR = SRC_DIR / "entities"

# Map category folders to TypeScript types
CATEGORY_TYPES = {
    "enemies": "EnemyEntity",
    "bosses": "BossEntity",
    "equipment": "EquipmentEntity",
    "items": "ItemEntity",
    "resources": "ResourceEntity",
    "nodes": "NodeEntity",
    "environment": "EnvironmentEntity",
    "npcs": "NPCEntity",
}

def get_entity_type(file_path: Path) -> str:
    """Determine entity type from file path"""
    # Get the category from path (e.g., enemies, equipment/weapons/sword)
    rel_path = file_path.relative_to(ENTITIES_DIR)
    category = rel_path.parts[0]
    return CATEGORY_TYPES.get(category, "BaseEntity")

def json_to_ts(json_path: Path) -> str:
    """Convert JSON file content to TypeScript module"""
    with open(json_path, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
    
    entity_type = get_entity_type(json_path)
    
    # Format JSON nicely
    json_str = json.dumps(data, indent=4, ensure_ascii=False)
    
    # Build TypeScript content
    ts_content = f"""/**
 * Entity: {data.get('id', json_path.stem)}
 * Auto-generated from JSON. Edit in dashboard.
 */
import type {{ {entity_type} }} from '@types/entities';

export default {json_str} satisfies {entity_type};
"""
    return ts_content

def convert_all():
    count = 0
    errors = []
    
    for json_file in ENTITIES_DIR.rglob("*.json"):
        # Skip manifest
        if json_file.name == "manifest.json":
            continue
        
        ts_file = json_file.with_suffix(".ts")
        
        try:
            ts_content = json_to_ts(json_file)
            
            # Write TS file
            with open(ts_file, 'w', encoding='utf-8') as f:
                f.write(ts_content)
            
            # Delete JSON file
            json_file.unlink()
            
            count += 1
            if count % 50 == 0:
                print(f"  Converted {count} files...")
                
        except Exception as e:
            errors.append(f"{json_file.name}: {e}")
    
    print(f"\nConverted {count} JSON files to TypeScript")
    if errors:
        print(f"Errors: {len(errors)}")
        for err in errors[:10]:
            print(f"  {err}")

if __name__ == "__main__":
    print("Converting entity JSON files to TypeScript modules...")
    convert_all()
