"""Set weaponType on new enemies that don't have it."""
import os
import json
import glob
import random

ENEMIES_DIR = 'src/entities/enemies'
BOSSES_DIR = 'src/entities/bosses'

# Weapon options from asset_prompts.md
MELEE_WEAPONS = ['sword', 'longsword', 'greatsword', 'axe', 'war_axe', 'mace', 'war_hammer', 'lance', 'halberd', 'spear', 'flail', 'knife']
RANGED_WEAPONS = ['rifle', 'pistol', 'submachine_gun', 'machine_gun', 'shotgun', 'sniper_rifle']

def set_weapon(filepath):
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
    
    # Only set if weaponType is missing or empty
    if data.get('weaponType'):
        return False
    
    # Only for humans and saurians
    source_file = data.get('sourceFile', '')
    if source_file not in ['human', 'saurian']:
        return False
    
    # Get attack type
    attack_type = data.get('combat', {}).get('attackType', 'melee')
    
    # Pick a random weapon appropriate for the tier
    tier = data.get('tier', 1)
    if attack_type == 'ranged':
        if tier <= 2:
            weapon = random.choice(['rifle', 'pistol', 'shotgun'])
        else:
            weapon = random.choice(['rifle', 'machine_gun', 'shotgun', 'sniper_rifle'])
    else:
        if tier <= 2:
            weapon = random.choice(['sword', 'axe', 'mace', 'spear', 'knife'])
        else:
            weapon = random.choice(['longsword', 'greatsword', 'war_axe', 'war_hammer', 'lance', 'halberd'])
    
    data['weaponType'] = weapon
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
        f.write('\n')
    
    print(f"Set {data['id']}: {attack_type} -> {weapon}")
    return True

count = 0
for d in [ENEMIES_DIR, BOSSES_DIR]:
    for f in glob.glob(f'{d}/*.json'):
        if set_weapon(f):
            count += 1

print(f"\nSet weaponType on {count} entities")
