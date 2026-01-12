import json

# Fix human.json - diversify face coverings, remove scene words
with open('tools/enemies/human.json', 'r') as f:
    humans = json.load(f)

human_fixes = {
    'human_t1_01': 'young frightened recruit, basic rifle, tattered uniform, stahlhelm with face guard',
    'human_t1_02': 'experienced soldier, bolt-action rifle, medieval war helm, muddy uniform',
    'human_t2_01': 'Sturmtruppen assault trooper, heavy armor, submachine gun, full-face helmet',
    'human_t3_01': 'heavy weapons specialist, bulky carrying harness, armored vest, iron mask, ammunition belt',
    'human_t4_01': 'Feldwebel sergeant, officer insignia, long coat, combat helmet with visor',
    'human_t4_02': 'Leutnant officer, decorated uniform, pistol holster, officer cap with visor'
}

for h in humans:
    if h['id'] in human_fixes:
        h['sourceDescription'] = human_fixes[h['id']]
        print(f"Human {h['id']}: Fixed")

with open('tools/enemies/human.json', 'w') as f:
    json.dump(humans, f, indent=4)

# Fix merchants.json - remove "platform" and related scene words
with open('tools/npcs/merchants.json', 'r') as f:
    merchants = json.load(f)

for m in merchants:
    desc = m.get('sourceDescription', '')
    # Remove common scene-implying phrases
    scene_phrases = [
        ', no background, no environment, no platform, no ground',
        ', isolated character only, no background, no environment, no platform, no ground',
        ', isolated character only',
        ', no platform',
        ', no ground',
        ', no environment',
        ', no background'
    ]
    for phrase in scene_phrases:
        if phrase in desc:
            desc = desc.replace(phrase, '')
            print(f"Merchant {m['id']}: Removed scene phrase")
    m['sourceDescription'] = desc.strip()

# Also replace gas mask in first merchant
for m in merchants:
    if 'gas mask' in m.get('sourceDescription', '').lower():
        m['sourceDescription'] = m['sourceDescription'].replace('gas mask covering face', 'miner helmet with lamp')
        print(f"Merchant {m['id']}: Diversified face covering")

with open('tools/npcs/merchants.json', 'w') as f:
    json.dump(merchants, f, indent=4)

print('\nDone!')
