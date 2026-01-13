import json

with open('tools/npcs/merchants.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Map old biome names to new numbers
biome_to_num = {
    'quarry': '01',
    'iron_ridge': '02', 
    'dead_woods': '03',
    'crossroads': '04',
    'scrap_yard': '05',
    'mud_flats': '06',
    'bone_valley': '07',
    'ruins': '08'
}

for item in data:
    if isinstance(item, dict) and item.get('id', '').startswith('npc_merchant_'):
        num = item['id'].split('_')[-1]  # Gets 01, 02, etc.
        # Update files to use new naming convention - remove clean since it doesn't exist yet
        item['files'] = {
            'original': f"assets/images/characters/npc_merchant_{num}_original.png"
        }
        print(f"Updated: {item['id']} -> {item['files']['original']}")

with open('tools/npcs/merchants.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4)

print('Done - removed old clean paths, updated original paths')
