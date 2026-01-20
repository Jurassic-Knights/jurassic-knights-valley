"""Remove files field from newly created entities so they show as pending."""
import os
import json
import glob

ENTITIES_DIRS = [
    'src/entities/enemies',
    'src/entities/bosses'
]

# List of new entity IDs we created
NEW_IDS = [
    'enemy_dinosaur_t2_02', 'enemy_dinosaur_t3_02', 'enemy_dinosaur_t4_01', 'enemy_dinosaur_t4_02', 'enemy_dinosaur_t4_03',
    'enemy_herbivore_t3_03', 'enemy_herbivore_t4_01', 'enemy_herbivore_t4_02', 'enemy_herbivore_t4_03',
    'enemy_human_t4_01', 'enemy_human_t4_02', 'enemy_human_t4_03',
    'enemy_saurian_t4_01', 'enemy_saurian_t4_02', 'enemy_saurian_t4_03',
    'boss_dinosaur_t1_01', 'boss_dinosaur_t1_02', 'boss_dinosaur_t2_01', 'boss_dinosaur_t3_01',
    'boss_human_t1_01', 'boss_human_t1_02', 'boss_human_t2_01', 'boss_human_t2_02', 'boss_human_t3_01', 'boss_human_t3_02',
    'boss_saurian_t1_01', 'boss_saurian_t1_02', 'boss_saurian_t2_01', 'boss_saurian_t2_02', 'boss_saurian_t3_01', 'boss_saurian_t3_02'
]

count = 0
for d in ENTITIES_DIRS:
    for f in glob.glob(f'{d}/*.json'):
        with open(f, 'r', encoding='utf-8-sig') as file:
            data = json.load(file)
        if data.get('id') in NEW_IDS:
            if 'files' in data:
                del data['files']
                with open(f, 'w', encoding='utf-8') as file:
                    json.dump(data, file, indent=4)
                    file.write('\n')
                print(f"Removed files from {data['id']}")
                count += 1
print(f"Fixed {count} entities")
