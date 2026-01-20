import json
import os

# Update flora
with open('tools/environment/flora.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

flora_ids = ['flora_grass_grasslands', 'flora_grass_badlands', 'flora_moss_tundra', 'flora_rock_desert']
for item in data:
    if isinstance(item, dict) and item.get('id') in flora_ids:
        item['status'] = 'pending'
        if 'declineNote' in item:
            del item['declineNote']
        print(f"Updated flora: {item['id']}")

with open('tools/environment/flora.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4)

# Update buildings
with open('tools/environment/buildings.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

bldg_ids = ['building_watchtower_grasslands', 'building_outpost_tower_tundra', 'building_minaret_tower_desert', 'building_guard_tower_badlands']
for item in data:
    if isinstance(item, dict) and item.get('id') in bldg_ids:
        item['status'] = 'pending'
        if 'declineNote' in item:
            del item['declineNote']
        print(f"Updated building: {item['id']}")

with open('tools/environment/buildings.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4)

# Update NPCs
with open('tools/npcs/merchants.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    if isinstance(item, dict) and item.get('status') == 'declined':
        item['status'] = 'pending'
        if 'declineNote' in item:
            del item['declineNote']
        # Update files path to use new naming
        item['files']['original'] = f"assets/images/characters/{item['id']}_original.png"
        print(f"Updated NPC: {item['id']}")

with open('tools/npcs/merchants.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4)

print("Done updating all 16 assets to pending")
