"""Debug script to test TypeScript entity reading"""
import os
import re
import json
from pathlib import Path

ENTITIES_DIR = Path(__file__).parent.parent / "src" / "entities"

def _read_ts_entity(filepath):
    """Read entity data from a TypeScript module file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract JSON object from: export default { ... } satisfies ...
    match = re.search(r'export\s+default\s+(\{[\s\S]*?\})\s*satisfies', content)
    if match:
        json_str = match.group(1)
        print(f"  Found object with satisfies pattern")
        # Parse as JSON
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f"  JSON parse error: {e}")
            # The issue might be trailing commas - try to fix them
            # Remove trailing commas before } or ]
            fixed = re.sub(r',(\s*[}\]])', r'\1', json_str)
            try:
                return json.loads(fixed)
            except:
                print(f"  Still failed after fix")
                return None
    
    print(f"  No satisfies pattern found")
    return None

# Test with a sample file
test_file = ENTITIES_DIR / "enemies" / "enemy_dinosaur_t1_01.ts"
print(f"Testing: {test_file}")
print(f"Exists: {test_file.exists()}")

if test_file.exists():
    result = _read_ts_entity(test_file)
    if result:
        print(f"SUCCESS: Parsed entity ID = {result.get('id')}")
        print(f"  Name: {result.get('name')}")
    else:
        print("FAILED to parse")
        # Show first 500 chars
        with open(test_file, 'r') as f:
            print(f"Content preview:\n{f.read()[:500]}")
