"""Set default role on human/saurian entities that don't have it."""
import os
import json
import glob
import random

ENEMIES_DIR = 'src/entities/enemies'
BOSSES_DIR = 'src/entities/bosses'

# Role distribution - varied roles for variety
ROLES = ['light', 'medium', 'medium', 'heavy', 'utility', 'special']

def set_role(filepath):
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
    
    # Only set if role is missing
    if data.get('role'):
        return False
    
    # Only for humans and saurians
    source_file = data.get('sourceFile', '')
    if source_file not in ['human', 'saurian']:
        return False
    
    # Pick a role - weighted towards medium, bosses get special more often
    is_boss = 'boss' in data.get('id', '')
    tier = data.get('tier', 1)
    
    if is_boss:
        role = random.choice(['heavy', 'special', 'special'])
    elif tier >= 4:
        role = random.choice(['medium', 'heavy', 'special'])
    elif tier >= 3:
        role = random.choice(['medium', 'heavy', 'utility'])
    else:
        role = random.choice(['light', 'medium', 'medium', 'utility'])
    
    data['role'] = role
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
        f.write('\n')
    
    print(f"Set {data['id']}: role = {role}")
    return True

count = 0
for d in [ENEMIES_DIR, BOSSES_DIR]:
    for f in glob.glob(f'{d}/*.json'):
        if set_role(f):
            count += 1

print(f"\nSet role on {count} entities")
