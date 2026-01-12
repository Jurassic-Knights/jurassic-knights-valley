import json
import os

DEFAULT_STATS = {
    'health': 50,
    'damage': 10,
    'speed': 60,
    'attackRate': 1.0,
    'attackRange': 100,
    'aggroRange': 200,
    'xpReward': 10,
    'threatLevel': 1,
    'attackType': 'melee',
    'packAggro': False,
    'flees': False,
    'gridSize': 1
}

enemy_files = ['tools/enemies/dinosaur.json', 'tools/enemies/herbivore.json', 'tools/enemies/human.json', 'tools/enemies/saurian.json']

for ef in enemy_files:
    if not os.path.exists(ef):
        continue
    
    with open(ef, 'r') as f:
        data = json.load(f)
    
    modified = 0
    for e in data:
        if 'stats' not in e:
            e['stats'] = {}
        
        for key, default_val in DEFAULT_STATS.items():
            if key not in e['stats']:
                e['stats'][key] = default_val
                modified += 1
        
        if 'vfx' not in e:
            e['vfx'] = {}
        for vfx_key in ['spawn', 'death', 'hit', 'aggro']:
            if vfx_key not in e['vfx']:
                e['vfx'][vfx_key] = {'id': 'vfx_' + vfx_key + '_' + e['id'], 'status': 'pending'}
                modified += 1
        
        if 'sfx' not in e:
            e['sfx'] = {}
        for sfx_key in ['spawn', 'death', 'hit', 'aggro']:
            if sfx_key not in e['sfx']:
                e['sfx'][sfx_key] = {'id': 'sfx_' + sfx_key + '_' + e['id'], 'status': 'pending'}
                modified += 1
    
    with open(ef, 'w') as f:
        json.dump(data, f, indent=4)
    
    print(ef + ': ' + str(modified) + ' properties added')

print('Done normalizing all enemies!')
