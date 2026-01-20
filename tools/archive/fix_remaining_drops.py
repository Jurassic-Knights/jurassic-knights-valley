import json

# Additional mappings for human/saurian non-weapon drops
DROP_MAPPING = {
    # These are valid material drops that need mapping
    'gunpowder': 'minerals_t2_05',
    'scrap_metal': 'salvage_t1_01',
    'scorch_scale': 'leather_t3_03',
    'thick_hide': 'leather_t2_02',
    'mechanical_parts': 'mechanical_t1_01',
    'precision_mechanism': 'mechanical_t3_04',
    'brass_casing': 'salvage_t1_03',
    'munitions': 'salvage_t2_02',
    'ration_tin': 'food_t1_03',
    'leather_scraps': 'leather_t1_01',
    'bone': 'bone_t1_01',
    'wool_gloves': None,  # Remove
}

def update_file(filepath):
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
                    if new_id:
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
                    else:
                        changed += 1
                else:
                    new_drops.append(drop)
        enemy['drops'] = new_drops
    
    with open(filepath, 'w') as f:
        json.dump(enemies, f, indent=4)
    return changed

print("=== UPDATING HUMAN DROPS ===")
c = update_file('tools/enemies/human.json')
print(f"Changed {c}\n")

print("=== UPDATING SAURIAN DROPS ===")
c = update_file('tools/enemies/saurian.json')
print(f"Changed {c}\n")

print("=== UPDATING BOSS DROPS ===")
c = update_file('tools/enemies/boss.json')
print(f"Changed {c}\n")

print("DONE")
