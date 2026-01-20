#!/usr/bin/env python3
"""
Fix entity ID patterns: Reset index to 01 for each tier (matching enemy pattern).
Wrong:  bone_t1_01, bone_t2_02, bone_t3_03
Correct: bone_t1_01, bone_t2_01, bone_t3_01
"""
import os
import json
import re
from collections import defaultdict

def build_rename_map(directory, pattern_prefix):
    """Build mapping from old IDs to new tier-reset IDs"""
    files = sorted([f for f in os.listdir(directory) if f.endswith('.json')])
    
    # Group by category and tier
    # e.g., bone_t1_01 -> category='bone', tier=1, index=1
    tier_groups = defaultdict(lambda: defaultdict(list))
    
    for filename in files:
        # Parse filename: category_t#_##.json
        match = re.match(r'(.+)_t(\d+)_(\d+)\.json', filename)
        if match:
            category, tier, old_idx = match.groups()
            tier_groups[category][int(tier)].append({
                'filename': filename,
                'old_id': f'{category}_t{tier}_{old_idx}',
                'tier': int(tier),
                'old_idx': old_idx
            })
    
    renames = []
    for category, tiers in tier_groups.items():
        for tier, items in sorted(tiers.items()):
            for new_idx, item in enumerate(items, 1):
                new_id = f'{category}_t{tier}_{new_idx:02d}'
                new_filename = f'{new_id}.json'
                
                if item['old_id'] != new_id:
                    renames.append({
                        'old_file': os.path.join(directory, item['filename']),
                        'new_file': os.path.join(directory, new_filename),
                        'old_id': item['old_id'],
                        'new_id': new_id
                    })
    
    return renames

def apply_renames(renames, dry_run=False):
    """Apply file renames and update internal IDs"""
    for r in renames:
        print(f"  {r['old_id']} -> {r['new_id']}")
        
        if not dry_run and os.path.exists(r['old_file']):
            # Read and update JSON content
            with open(r['old_file'], 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace old ID with new ID
            content = content.replace(r['old_id'], r['new_id'])
            
            # Write to new file first (in case same name)
            with open(r['new_file'], 'w', encoding='utf-8') as f:
                f.write(content)
            
            # Remove old file if different
            if r['old_file'] != r['new_file']:
                os.remove(r['old_file'])

def update_references(renames, search_dirs):
    """Update all references in other files"""
    for search_dir in search_dirs:
        if not os.path.exists(search_dir):
            continue
        for root, dirs, files in os.walk(search_dir):
            # Skip node_modules and .git
            dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', '__pycache__']]
            
            for filename in files:
                if filename.endswith(('.json', '.js')):
                    filepath = os.path.join(root, filename)
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            content = f.read()
                        
                        original = content
                        for r in renames:
                            content = content.replace(r['old_id'], r['new_id'])
                        
                        if content != original:
                            with open(filepath, 'w', encoding='utf-8') as f:
                                f.write(content)
                            print(f"  Updated: {filepath}")
                    except:
                        pass

if __name__ == '__main__':
    all_renames = []
    
    print("=== Building rename maps ===\n")
    
    # Items
    items_dir = 'src/entities/items'
    if os.path.exists(items_dir):
        print(f"Items ({items_dir}):")
        items_renames = build_rename_map(items_dir, '')
        all_renames.extend(items_renames)
        for r in items_renames:
            print(f"  {r['old_id']} -> {r['new_id']}")
    
    # Resources
    resources_dir = 'src/entities/resources'
    if os.path.exists(resources_dir):
        print(f"\nResources ({resources_dir}):")
        resources_renames = build_rename_map(resources_dir, '')
        all_renames.extend(resources_renames)
        for r in resources_renames:
            print(f"  {r['old_id']} -> {r['new_id']}")
    
    # Equipment
    equipment_dir = 'src/entities/equipment'
    if os.path.exists(equipment_dir):
        print(f"\nEquipment ({equipment_dir}):")
        equipment_renames = build_rename_map(equipment_dir, '')
        all_renames.extend(equipment_renames)
        for r in equipment_renames:
            print(f"  {r['old_id']} -> {r['new_id']}")
    
    print(f"\n=== Applying {len(all_renames)} renames ===\n")
    
    # Apply renames
    for r in all_renames:
        if os.path.exists(r['old_file']):
            with open(r['old_file'], 'r', encoding='utf-8') as f:
                content = f.read()
            content = content.replace(r['old_id'], r['new_id'])
            with open(r['new_file'], 'w', encoding='utf-8') as f:
                f.write(content)
            if r['old_file'] != r['new_file']:
                os.remove(r['old_file'])
            print(f"Renamed: {r['old_id']} -> {r['new_id']}")
    
    print(f"\n=== Updating references ===\n")
    update_references(all_renames, ['src', 'tools'])
    
    print(f"\n=== Complete: {len(all_renames)} IDs fixed ===")
