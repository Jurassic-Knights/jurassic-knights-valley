import json
import os
from pathlib import Path

base = Path('.')

# Update all JSON files in tools directory
updates = {
    'tools/enemies/human.json': ['human_t1_01', 'human_t1_02', 'human_t2_01', 'human_t3_01', 'human_t4_01', 'human_t4_02'],
    'tools/enemies/dinosaur.json': ['dinosaur_t1_02', 'dinosaur_t2_01', 'dinosaur_t2_02', 'dinosaur_t2_05', 'dinosaur_t3_02', 'dinosaur_t4_01'],
    'tools/enemies/saurian.json': ['saurian_t1_01'],
    'tools/enemies/herbivore.json': ['herbivore_t1_01', 'herbivore_t1_02', 'herbivore_t2_01', 'herbivore_t2_02', 'herbivore_t3_01', 'herbivore_t3_02', 'herbivore_t4_01', 'herbivore_t4_02', 'herbivore_t2_03', 'herbivore_t3_03'],
    'tools/items/bone.json': ['bone_t3_03', 'bone_t4_04'],
    'tools/items/leather.json': ['leather_t1_01', 'leather_t2_02', 'leather_t4_04'],
    'tools/items/mechanical.json': ['mechanical_t2_02'],
    'tools/items/metal.json': ['metal_t1_01', 'metal_t4_04'],
    'tools/resources/minerals.json': ['minerals_t1_01', 'minerals_t2_05', 'minerals_t3_08'],
    'tools/resources/wood.json': ['scraps_t1_01'],
}

total = 0
for filepath, ids in updates.items():
    if not Path(filepath).exists():
        print(f"Skipping {filepath} - not found")
        continue
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    for item in data:
        if item.get('id') in ids:
            item['status'] = 'pending'
            if 'declineNote' in item:
                del item['declineNote']
            total += 1
            print(f"Updated {item['id']} to pending")
    
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4)

print(f"\nTotal updated: {total}")
