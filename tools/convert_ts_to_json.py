"""
Convert TypeScript entity modules back to JSON files
Transforms: export default { ... } satisfies EntityType; → { ... }
"""

import os
import re
import json
from pathlib import Path

SRC_DIR = Path(__file__).parent.parent / "src"
ENTITIES_DIR = SRC_DIR / "entities"

def ts_to_json(ts_path: Path) -> str:
    """Extract JSON from TypeScript module"""
    with open(ts_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the object literal between "export default" and "satisfies"
    # Pattern: export default { ... } satisfies SomeType;
    match = re.search(r'export\s+default\s+(\{[\s\S]*?\})\s*satisfies', content)
    
    if match:
        json_str = match.group(1)
        # Parse and re-format as clean JSON
        try:
            data = eval(json_str)  # Safe for our auto-generated content
            return json.dumps(data, indent=2, ensure_ascii=False)
        except:
            return json_str
    
    # Fallback: try to find just export default { ... };
    match = re.search(r'export\s+default\s+(\{[\s\S]*?\});?\s*$', content)
    if match:
        json_str = match.group(1)
        try:
            data = eval(json_str)
            return json.dumps(data, indent=2, ensure_ascii=False)
        except:
            return json_str
    
    return None

def convert_all():
    count = 0
    errors = []
    
    for ts_file in ENTITIES_DIR.rglob("*.ts"):
        # Skip non-entity files
        if ts_file.name in ['index.ts']:
            continue
        
        json_file = ts_file.with_suffix(".json")
        
        try:
            json_content = ts_to_json(ts_file)
            
            if json_content:
                # Write JSON file
                with open(json_file, 'w', encoding='utf-8') as f:
                    f.write(json_content)
                
                # Delete TS file
                ts_file.unlink()
                
                count += 1
                if count % 50 == 0:
                    print(f"  Converted {count} files...")
            else:
                errors.append(f"{ts_file.name}: Could not extract JSON")
                
        except Exception as e:
            errors.append(f"{ts_file.name}: {e}")
    
    print(f"\nConverted {count} TypeScript files back to JSON")
    if errors:
        print(f"Errors: {len(errors)}")
        for err in errors[:10]:
            print(f"  {err}")

if __name__ == "__main__":
    print("Converting entity TypeScript files back to JSON...")
    convert_all()
