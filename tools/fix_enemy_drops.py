import json
from pathlib import Path

# Map invalid drops to valid item/resource IDs
DROP_MAPPING = {
    # Bones
    'bone': 'bone_t1_01',
    'bone_plate': 'bone_t2_02',
    'ancient_bone': 'bone_t3_03',
    'sun_bleached_bone': 'bone_t2_02',
    
    # Meat/Food
    'raw_meat': 'food_t1_02',
    'fatty_meat': 'food_t2_04',
    'charred_meat': 'food_t2_05',
    'dried_jerky': 'food_t3_09',
    'ration_tin': 'food_t1_03',
    'sand_grub': 'food_t1_01',
    
    # Leather/Hide
    'leather_scraps': 'leather_t1_01',
    'thick_hide': 'leather_t2_02',
    'sinew': 'leather_t1_01',
    'feather': 'scraps_t1_02',
    'horn_fragment': 'bone_t1_01',
    
    # Scales
    'scorch_scale': 'leather_t3_03',
    'titan_scale': 'leather_t4_04',
    
    # Minerals
    'salt_crystal': 'minerals_t1_01',
    'gold_dust': 'minerals_t3_08',
    'tungsten': 'minerals_t4_12',
    'volcanic_glass': 'minerals_t3_10',
    'gunpowder': 'minerals_t2_05',
    
    # Mechanical/Salvage
    'scrap_metal': 'salvage_t1_01',
    'mechanical_parts': 'mechanical_t1_01',
    'precision_mechanism': 'mechanical_t3_04',
    'brass_casing': 'salvage_t1_03',
    'munitions': 'salvage_t2_02',
    
    # Remove these (shouldn't be drops for dinos/herbs)
    'wool_gloves': None,
}

def update_enemy_file(filepath, enemy_type):
    with open(filepath, 'r') as f:
        enemies = json.load(f)
    
    changed = 0
    for enemy in enemies:
        if not isinstance(enemy, dict):
            continue
        drops = enemy.get('drops', [])
        new_drops = []
        for drop in drops:
            if isinstance(drop, dict):
                drop_id = drop.get('id')
                if drop_id in DROP_MAPPING:
                    new_id = DROP_MAPPING[drop_id]
                    if new_id:  # None means remove
                        drop['id'] = new_id
                        new_drops.append(drop)
                        changed += 1
                        print(f"  {enemy.get('id')}: {drop_id} -> {new_id}")
                    else:
                        print(f"  {enemy.get('id')}: REMOVED {drop_id}")
                        changed += 1
                else:
                    new_drops.append(drop)
            else:
                if drop in DROP_MAPPING:
                    new_id = DROP_MAPPING[drop]
                    if new_id:
                        new_drops.append(new_id)
                        changed += 1
                        print(f"  {enemy.get('id')}: {drop} -> {new_id}")
                    else:
                        print(f"  {enemy.get('id')}: REMOVED {drop}")
                        changed += 1
                else:
                    new_drops.append(drop)
        enemy['drops'] = new_drops
    
    with open(filepath, 'w') as f:
        json.dump(enemies, f, indent=4)
    
    return changed

# Only update dinosaur and herbivore (not human/saurian/boss)
print("=== UPDATING DINOSAUR DROPS ===")
changes = update_enemy_file('tools/enemies/dinosaur.json', 'dinosaur')
print(f"Changed {changes} drops\n")

print("=== UPDATING HERBIVORE DROPS ===")
changes = update_enemy_file('tools/enemies/herbivore.json', 'herbivore')
print(f"Changed {changes} drops\n")

print("=== DONE ===")
