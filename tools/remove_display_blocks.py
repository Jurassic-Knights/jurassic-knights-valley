#!/usr/bin/env python3
"""
Remove the 'display' block from all enemy and boss entity JSONs.
Sizes are now computed at runtime via SpeciesScaleConfig.js
"""

import json
from pathlib import Path

ENTITIES_DIR = Path(__file__).parent.parent / "src" / "entities"

def remove_display_block(file_path):
    """Remove display block from an entity JSON file."""
    with open(file_path, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
    
    if 'display' in data:
        del data['display']
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"  Cleaned: {file_path.stem}")
        return True
    return False

def main():
    enemies_dir = ENTITIES_DIR / "enemies"
    bosses_dir = ENTITIES_DIR / "bosses"
    
    cleaned = 0
    
    if enemies_dir.exists():
        print("Cleaning enemies...")
        for file in sorted(enemies_dir.glob("*.json")):
            if remove_display_block(file):
                cleaned += 1
    
    if bosses_dir.exists():
        print("\nCleaning bosses...")
        for file in sorted(bosses_dir.glob("*.json")):
            if remove_display_block(file):
                cleaned += 1
    
    print(f"\nRemoved display block from {cleaned} entity files")

if __name__ == "__main__":
    main()
