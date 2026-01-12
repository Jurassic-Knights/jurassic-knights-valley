import json

# Fix saurian source descriptions - equipment/clothing ONLY, no species
# The template adds "anthropomorphic [SPECIES]" so sourceDesc should just be gear
with open('tools/enemies/saurian.json', 'r') as f:
    saurians = json.load(f)

# Correct descriptions - equipment and clothing only, medieval/WWI themed
replacements = {
    'saurian_t1_01': 'leather riding harness, simple iron helm, lance with military pennant, ammunition pouch',
    'saurian_t2_01': 'plate barding armor, cavalry saddle, jousting lance, reinforced pauldrons',
    'saurian_t3_01': 'mounted machine gun harness, iron plate armor, ammunition belt, heavy shield, spiked knuckles',
    'saurian_t4_01': 'heavy steel plate armor, battle-worn and scarred, armored helm with visor, chain mail undercoat'
}

for saurian in saurians:
    if isinstance(saurian, dict):
        sid = saurian.get('id')
        if sid in replacements:
            old = saurian.get('sourceDescription', '')
            saurian['sourceDescription'] = replacements[sid]
            print(f"{sid}:")
            print(f"  OLD: {old}")
            print(f"  NEW: {replacements[sid]}")
            print()

with open('tools/enemies/saurian.json', 'w') as f:
    json.dump(saurians, f, indent=4)

print("Done - saurian descriptions now equipment-only, no species")
