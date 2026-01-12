import json
import os
import glob
import re

# Words/phrases that imply a scene, not just a character
SCENE_WORDS = [
    'emplacement', 'defensive position', 'fortification', 'turret',
    'trench', 'bunker', 'sandbags', 'barricade', 'platform',
    'mounted on', 'riding', 'sitting on', 'standing on',
    'battlefield', 'environment', 'background', 'ground',
    'formation', 'patrol', 'group', 'squad',
    'explosion', 'smoke', 'fire', 'debris',
    'camp', 'outpost', 'position', 'deployment'
]

# Count gas mask usage and track for replacement
gas_mask_count = 0
total_humans = 0

# Replacement face coverings (more variety)
FACE_COVERINGS = [
    'full-face helmet',
    'stahlhelm with face guard',
    'medieval war helm',
    'knight helmet',
    'hooded mask',
    'iron mask',
    'riveted faceplate',
    'welding mask',
    'leather hood with goggles',
    'skull-faced visor',
    'plague doctor mask',
    'sallet helm',
    'barbuta helmet',
    'great helm'
]

issues_found = []
files_to_fix = [
    'tools/enemies/human.json',
    'tools/enemies/dinosaur.json', 
    'tools/enemies/saurian.json',
    'tools/enemies/herbivore.json',
    'tools/npcs/merchants.json',
]

for filepath in files_to_fix:
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for item in data:
        desc = item.get('sourceDescription', '')
        item_id = item.get('id', 'unknown')
        
        # Check for scene-implying words
        for word in SCENE_WORDS:
            if word.lower() in desc.lower():
                issues_found.append({
                    'file': filepath,
                    'id': item_id,
                    'issue': f'Scene word: "{word}"',
                    'desc': desc[:80]
                })
                break
        
        # Count gas mask usage in human enemies
        if 'human' in filepath or 'merchant' in filepath:
            total_humans += 1
            if 'gas mask' in desc.lower():
                gas_mask_count += 1

print("=" * 60)
print("SCENE-IMPLYING WORDS FOUND:")
print("=" * 60)
for issue in issues_found:
    print(f"\n{issue['file']} -> {issue['id']}")
    print(f"  Issue: {issue['issue']}")
    print(f"  Desc: {issue['desc']}...")

print("\n" + "=" * 60)
print(f"GAS MASK USAGE: {gas_mask_count}/{total_humans} humans ({100*gas_mask_count//max(1,total_humans)}%)")
print("=" * 60)
print("\nRecommended: Gas mask should be < 30% of face coverings")

if gas_mask_count > 0:
    print(f"\nFiles with gas mask mentions to diversify:")
    for filepath in files_to_fix:
        if not os.path.exists(filepath):
            continue
        with open(filepath, 'r') as f:
            data = json.load(f)
        for item in data:
            desc = item.get('sourceDescription', '')
            if 'gas mask' in desc.lower():
                print(f"  - {item.get('id')}: {desc[:60]}...")
