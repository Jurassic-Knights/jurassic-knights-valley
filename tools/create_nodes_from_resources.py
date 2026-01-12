import json

# 1. Remove trees from flora.json
with open('tools/environment/flora.json', 'r') as f:
    flora = json.load(f)

original_count = len(flora)
flora = [f for f in flora if 'tree' not in f.get('id', '').lower()]
removed_count = original_count - len(flora)

with open('tools/environment/flora.json', 'w') as f:
    json.dump(flora, f, indent=4)

print(f"Removed {removed_count} tree entries from flora.json")
print(f"Flora now has {len(flora)} assets\n")

# 2. Load existing nodes
with open('tools/nodes/nodes.json', 'r') as f:
    existing_nodes = json.load(f)
existing_names = {n.get('name', '').lower() for n in existing_nodes}
print(f"Existing nodes: {len(existing_nodes)}")

# 3. Collect all sources from resources (non-enemy)
all_resources = []
for file in ['food.json', 'minerals.json', 'salvage.json', 'scraps.json']:
    with open(f'tools/resources/{file}', 'r') as f:
        all_resources.extend(json.load(f))

# Extract unique sources, filtering out enemy sources
enemy_keywords = ['herbivore', 'creature', 'kill', 'soldier', 'sergeant', 'officer']
node_sources = {}

for res in all_resources:
    source = res.get('source', '')
    biome = res.get('biome', 'all')
    tier = res.get('tier', 1)
    
    # Skip if source contains enemy keywords
    if any(kw in source.lower() for kw in enemy_keywords):
        continue
    
    # Split sources that have commas
    sources_list = [s.strip() for s in source.split(',')]
    for src in sources_list:
        if any(kw in src.lower() for kw in enemy_keywords):
            continue
        if src:
            key = src.lower()
            if key not in node_sources:
                node_sources[key] = {
                    'name': src,
                    'biome': biome,
                    'tier': tier,
                    'resources': []
                }
            node_sources[key]['resources'].append(res.get('name', res.get('id')))

# 4. Create new nodes (skip existing)
new_nodes = []
for key, info in sorted(node_sources.items()):
    # Skip if already exists
    if key in existing_names:
        continue
    
    source = info['name']
    source_snake = source.lower().replace(' ', '_').replace('-', '_')
    node_id = f"node_{source_snake}"
    
    # Determine node type
    if 'tree' in source.lower():
        node_type = 'wood'
        desc = f"{source.lower()}, harvestable tree, full of wood, natural growth"
        consumed_desc = f"depleted {source.lower()}, bare stump, no wood remaining"
    elif 'vein' in source.lower() or 'deposit' in source.lower() or 'seam' in source.lower():
        node_type = 'mineral'
        desc = f"{source.lower()}, mining node, ore visible in rock, pickaxe marks"
        consumed_desc = f"depleted {source.lower()}, mined out cavity, no ore remaining"
    elif 'bush' in source.lower():
        node_type = 'food'
        desc = f"{source.lower()}, foraging node, berries or fruit visible, natural vegetation"
        consumed_desc = f"depleted {source.lower()}, bare branches, no berries remaining"
    elif 'wheat' in source.lower() or 'grass' in source.lower():
        node_type = 'plant'
        desc = f"{source.lower()}, harvestable plant, ready for gathering"
        consumed_desc = f"harvested {source.lower()}, cut stalks, regrowth needed"
    elif 'hole' in source.lower():
        node_type = 'fishing'
        desc = f"{source.lower()}, fishing spot, dark water, fish visible below"
        consumed_desc = f"depleted {source.lower()}, murky water, no fish remaining"
    elif 'ground' in source.lower():
        node_type = 'foraging'
        desc = f"{source.lower()}, digging spot, disturbed earth, resources beneath"
        consumed_desc = f"dug out {source.lower()}, empty hole, no resources"
    elif 'cactus' in source.lower():
        node_type = 'plant'
        desc = f"{source.lower()}, harvestable desert plant, fruit and spines"
        consumed_desc = f"harvested {source.lower()}, bare cactus, no fruit"
    elif 'nest' in source.lower() or 'burrow' in source.lower():
        node_type = 'foraging'
        desc = f"{source.lower()}, creature nest, resources visible"
        consumed_desc = f"empty {source.lower()}, ransacked, abandoned"
    elif 'pile' in source.lower() or 'formation' in source.lower() or 'outcrop' in source.lower():
        node_type = 'mineral'
        desc = f"{source.lower()}, resource deposit, minerals visible"
        consumed_desc = f"depleted {source.lower()}, empty, picked clean"
    elif 'carcass' in source.lower() or 'remains' in source.lower():
        node_type = 'salvage'
        desc = f"{source.lower()}, animal remains, bones and materials visible"
        consumed_desc = f"stripped {source.lower()}, bare bones, nothing left"
    elif 'flat' in source.lower():
        node_type = 'mineral'
        desc = f"{source.lower()}, surface mineral deposit, salt crystals visible"
        consumed_desc = f"harvested {source.lower()}, scraped clean"
    elif 'rock' in source.lower():
        node_type = 'mineral'
        desc = f"{source.lower()}, rock formation, harvestable stone"
        consumed_desc = f"depleted {source.lower()}, crumbled, nothing usable"
    elif 'crate' in source.lower() or 'kitchen' in source.lower():
        node_type = 'salvage'
        desc = f"{source.lower()}, military supplies, WWI-era container"
        consumed_desc = f"empty {source.lower()}, looted, nothing remaining"
    elif 'riverbank' in source.lower():
        node_type = 'foraging'
        desc = f"riverbank deposit, clay and sediment visible, muddy"
        consumed_desc = f"dug out riverbank, empty hole, no clay"
    else:
        node_type = 'foraging'
        desc = f"{source.lower()}, resource node, harvestable"
        consumed_desc = f"depleted {source.lower()}, empty, exhausted"
    
    node = {
        "id": node_id,
        "name": source,
        "tier": info['tier'],
        "nodeType": node_type,
        "resourceDrop": info['resources'][0] if info['resources'] else 'unknown',
        "biome": info['biome'],
        "rarity": "common",
        "status": "pending",
        "harvestCount": 3 if info['tier'] <= 2 else 5,
        "respawnTime": 30 + (info['tier'] * 15),
        "sourceDescription": desc,
        "consumedSourceDescription": consumed_desc,
        "files": {},
        "yields": info['resources']
    }
    new_nodes.append(node)

# 5. Append to existing and save
existing_nodes.extend(new_nodes)

with open('tools/nodes/nodes.json', 'w') as f:
    json.dump(existing_nodes, f, indent=4)

print(f"\nAdded {len(new_nodes)} new nodes:")
for n in new_nodes:
    print(f"  - {n['name']} ({n['biome']}): yields {n['yields']}")

print(f"\nTotal nodes now: {len(existing_nodes)}")
