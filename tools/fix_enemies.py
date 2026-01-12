import json

# Fix human.json - remove scene-generating words
with open('tools/enemies/human.json', 'r') as f:
    humans = json.load(f)

human_updates = {
    'human_t1_01': 'young frightened recruit, basic rifle, tattered uniform, gas mask',
    'human_t1_02': 'experienced soldier, bolt-action rifle, helmet and gas mask, muddy uniform',
    'human_t2_01': 'Sturmtruppen assault trooper, heavy armor, submachine gun, full-face helmet',
    'human_t3_01': 'heavy weapons specialist, bulky carrying harness, armored vest, gas mask, ammunition belt',
    'human_t4_01': 'Feldwebel sergeant, officer insignia, trench coat, combat helmet',
    'human_t4_02': 'Leutnant officer, decorated uniform, pistol holster, officer cap with visor'
}

for h in humans:
    if h['id'] in human_updates:
        h['sourceDescription'] = human_updates[h['id']]
        print(f"Human {h['id']}: Updated")

with open('tools/enemies/human.json', 'w') as f:
    json.dump(humans, f, indent=4)

# Fix saurian.json - clean up boilerplate, keep only physical appearance
with open('tools/enemies/saurian.json', 'r') as f:
    saurians = json.load(f)

saurian_updates = {
    'saurian_t1_01': 'velociraptor warrior, tribal armor, spear, feathered crest',
    'saurian_t2_01': 'triceratops lancer, ceremonial armor, jousting lance, armored frill',
    'saurian_t3_01': 'ankylosaurus gunner, portable machine gun, heavily armored hide, club tail',
    'saurian_t4_01': 'tyrannosaurus warlord chieftain, battle-worn armor, tribal markings, massive build'
}

for s in saurians:
    if s['id'] in saurian_updates:
        s['sourceDescription'] = saurian_updates[s['id']]
        print(f"Saurian {s['id']}: Updated")

with open('tools/enemies/saurian.json', 'w') as f:
    json.dump(saurians, f, indent=4)

print('\nDone!')
