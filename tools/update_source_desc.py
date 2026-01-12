import json

with open('tools/enemies/herbivore.json', 'r') as f:
    data = json.load(f)

# Update sourceDescriptions - physical appearance ONLY, no poses
updates = {
    'herbivore_t1_01': 'thumb spike visible, bulky herbivore build, brownish-green hide with darker stripes',
    'herbivore_t1_02': 'distinctive tubular head crest, duck-billed snout, olive-brown coloring with yellow underbelly',
    'herbivore_t1_03': 'rounded duck-bill, tan coloring with reddish-brown markings, herd animal build',
    'herbivore_t2_01': 'distinctive back plates with orange edges, spiked tail thagomizer, grey-green armored hide',
    'herbivore_t2_02': 'elaborate spiked frill, single large nose horn, rust-brown coloring',
    'herbivore_t2_03': 'thick dome skull, compact muscular build, mottled grey-brown hide',
    'herbivore_t3_01': 'three prominent horns, massive bony frill, battle-scarred grey hide',
    'herbivore_t3_02': 'extremely long neck, towering sauropod, blue-grey skin',
    'herbivore_t4_01': 'massive long-necked sauropod, whip-like tail, weathered grey-brown hide',
    'herbivore_t4_02': 'colossal sauropod, thick column-like legs, armored back ridges'
}

for h in data:
    if h['id'] in updates:
        h['sourceDescription'] = updates[h['id']]
        print(f"{h['id']}: Updated")

with open('tools/enemies/herbivore.json', 'w') as f:
    json.dump(data, f, indent=4)

print('Done - poses removed!')
