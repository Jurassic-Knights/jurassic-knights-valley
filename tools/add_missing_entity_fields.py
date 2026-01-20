#!/usr/bin/env python3
"""
Add missing required fields to entity JSON files.
- Enemies: Add 'drops' and 'description' fields
- Equipment: Add 'tier' field (parsed from filename)
- Bosses: Add 'drops' field
"""
import os
import json
import re

def get_tier_from_filename(filename):
    """Extract tier number from filename like 'chest_t2_01.json'"""
    match = re.search(r'_t(\d+)_', filename)
    return int(match.group(1)) if match else 1

def add_missing_fields(directory, field_defaults):
    """Add missing fields to JSON files in directory"""
    updated = 0
    for filename in sorted(os.listdir(directory)):
        if not filename.endswith('.json'):
            continue
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        changed = False
        for field, default_value in field_defaults.items():
            if field not in data:
                if callable(default_value):
                    data[field] = default_value(filename, data)
                else:
                    data[field] = default_value
                changed = True
        
        if changed:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4)
            print(f"Updated: {filename}")
            updated += 1
    return updated

def main():
    print("=== Adding Missing Entity Fields ===\n")
    
    # Enemies: Add drops and description
    print("--- Enemies ---")
    enemy_defaults = {
        'drops': [],  # Empty array, to be filled by game design
        'description': lambda fn, d: d.get('name', 'Unknown enemy')
    }
    count = add_missing_fields('src/entities/enemies', enemy_defaults)
    print(f"Updated {count} enemy files\n")
    
    # Equipment: Add tier from filename
    print("--- Equipment ---")
    equipment_defaults = {
        'tier': lambda fn, d: get_tier_from_filename(fn)
    }
    count = add_missing_fields('src/entities/equipment', equipment_defaults)
    print(f"Updated {count} equipment files\n")
    
    # Bosses: Add drops
    print("--- Bosses ---")
    boss_defaults = {
        'drops': []  # Empty array, to be filled by game design
    }
    count = add_missing_fields('src/entities/bosses', boss_defaults)
    print(f"Updated {count} boss files\n")
    
    print("=== Complete ===")

if __name__ == '__main__':
    main()
