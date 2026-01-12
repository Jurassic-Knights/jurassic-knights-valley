import json

# Fix human.json - outfit/gear only, no emotions/poses
with open('tools/enemies/human.json', 'r') as f:
    humans = json.load(f)

human_fixes = {
    'human_t1_01': 'recruit uniform, basic rifle, tattered cloth, stahlhelm with face guard',
    'human_t1_02': 'infantry uniform, bolt-action rifle, muddy coat, medieval war helm',
    'human_t2_01': 'Sturmtruppen assault armor, submachine gun, plate carrier, full-face helmet',
    'human_t3_01': 'heavy weapons harness, machine gun, armored vest, ammunition belt, iron mask',
    'human_t4_01': 'Feldwebel sergeant uniform, officer insignia, long coat, combat helmet with visor',
    'human_t4_02': 'Leutnant officer uniform, decorated jacket, pistol holster, officer cap with visor'
}

for h in humans:
    if h['id'] in human_fixes:
        h['sourceDescription'] = human_fixes[h['id']]
        print(f"Human {h['id']}: Fixed")

with open('tools/enemies/human.json', 'w') as f:
    json.dump(humans, f, indent=4)

print('\nDone!')
