import json

# Mark specific flora assets as declined with note about tile issue
flora_to_decline = [
    'flora_grass_grasslands',
    'flora_grass_badlands', 
    'flora_moss_tundra',
    'flora_rock_desert'
]

with open('tools/environment/flora.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    if isinstance(item, dict) and item.get('id') in flora_to_decline:
        item['status'] = 'declined'
        item['declineNote'] = 'Generated on isometric tile - must be standalone floating vegetation with no ground/tile'
        print(f"Declined: {item['id']}")

with open('tools/environment/flora.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4)

print('Done')
