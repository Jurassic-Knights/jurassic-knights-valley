import json

with open('tools/environment/buildings.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

bldg_ids = ['building_watchtower_grasslands', 'building_outpost_tower_tundra', 'building_minaret_tower_desert', 'building_guard_tower_badlands']
for item in data:
    if isinstance(item, dict) and item.get('id') in bldg_ids:
        item['status'] = 'declined'
        item['declineNote'] = 'Regenerate with isometric perspective instead of horizontal side view'
        print(f"Declined: {item['id']}")

with open('tools/environment/buildings.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4)
print('Done')
