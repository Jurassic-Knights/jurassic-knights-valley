import json
from pathlib import Path

# Get all existing items and resources
all_valid = {}

# Items
for f in Path('tools/items').glob('*.json'):
    if f.name.startswith('_') or f.name == 'asset_queue.json':
        continue
    with open(f, 'r') as file:
        items = json.load(file)
    for item in items:
        if isinstance(item, dict):
            name_key = (item.get('name', '')).lower().replace(' ', '_')
            all_valid[name_key] = item.get('id')
            all_valid[item.get('id')] = item.get('id')

# Resources
for f in Path('tools/resources').glob('*.json'):
    if f.name.startswith('_') or f.name == 'asset_queue.json':
        continue
    with open(f, 'r') as file:
        resources = json.load(file)
    for res in resources:
        if isinstance(res, dict):
            name_key = (res.get('name', '')).lower().replace(' ', '_')
            all_valid[name_key] = res.get('id')
            all_valid[res.get('id')] = res.get('id')

print("=== VALID ITEMS/RESOURCES ===")
unique_ids = sorted(set(all_valid.values()))
for uid in unique_ids:
    print(f"  - {uid}")

print(f"\nTotal unique: {len(unique_ids)}")
