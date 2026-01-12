import json
import os
from pathlib import Path

base = Path('.')

# Collect all drops from enemy files
all_drops = set()
enemy_files = list(Path('tools/enemies').glob('*.json'))
for ef in enemy_files:
    if ef.name.startswith('_'):
        continue
    with open(ef, 'r') as f:
        enemies = json.load(f)
    for enemy in enemies:
        if not isinstance(enemy, dict):
            continue
        drops = enemy.get('drops', [])
        for drop in drops:
            drop_id = drop.get('id') if isinstance(drop, dict) else drop
            all_drops.add(drop_id)

print(f"=== Found {len(all_drops)} unique drop IDs from enemies ===")
for d in sorted(all_drops):
    print(f"  - {d}")

# Collect all items from items folder
all_items = {}
item_files = list(Path('tools/items').glob('*.json'))
for ifile in item_files:
    if ifile.name.startswith('_') or ifile.name == 'asset_queue.json':
        continue
    with open(ifile, 'r') as f:
        items = json.load(f)
    for item in items:
        # Map by name (lowercase, underscored) and by id
        name_key = (item.get('name', '')).lower().replace(' ', '_')
        all_items[name_key] = item.get('id')
        all_items[item.get('id')] = item.get('id')

print(f"\n=== Found {len(all_items)//2} items ===")

# Collect all resources
all_resources = {}
resource_files = list(Path('tools/resources').glob('*.json'))
for rfile in resource_files:
    if rfile.name.startswith('_') or rfile.name == 'asset_queue.json':
        continue
    with open(rfile, 'r') as f:
        resources = json.load(f)
    for resource in resources:
        name_key = (resource.get('name', '')).lower().replace(' ', '_')
        all_resources[name_key] = resource.get('id')
        all_resources[resource.get('id')] = resource.get('id')

print(f"=== Found {len(all_resources)//2} resources ===")

# Check which drops are missing
print(f"\n=== MISSING DROPS (not found in items or resources) ===")
missing_drops = []
found_drops = []
for drop_id in sorted(all_drops):
    if drop_id in all_items or drop_id in all_resources:
        found_drops.append(drop_id)
    else:
        missing_drops.append(drop_id)
        print(f"  MISSING: {drop_id}")

print(f"\n=== SUMMARY ===")
print(f"Total unique drops: {len(all_drops)}")
print(f"Found in items/resources: {len(found_drops)}")
print(f"Missing: {len(missing_drops)}")

if missing_drops:
    print(f"\n=== MISSING DROP IDs ===")
    for d in missing_drops:
        print(f"  - {d}")
