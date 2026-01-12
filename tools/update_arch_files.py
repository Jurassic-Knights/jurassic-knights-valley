import json

with open('tools/environment/architecture.json', 'r') as f:
    arch = json.load(f)

# All 34 architecture assets
all_assets = [
    # Biome-specific (4 biomes x 7 types = 28)
    'arch_fence_grasslands', 'arch_fence_tundra', 'arch_fence_desert', 'arch_fence_badlands',
    'arch_road_grasslands', 'arch_road_tundra', 'arch_road_desert', 'arch_road_badlands',
    'arch_wall_grasslands', 'arch_wall_tundra', 'arch_wall_desert', 'arch_wall_badlands',
    'arch_bridge_grasslands', 'arch_bridge_tundra', 'arch_bridge_desert', 'arch_bridge_badlands',
    'arch_gate_grasslands', 'arch_gate_tundra', 'arch_gate_desert', 'arch_gate_badlands',
    'arch_post_grasslands', 'arch_post_tundra', 'arch_post_desert', 'arch_post_badlands',
    'arch_tower_grasslands', 'arch_tower_tundra', 'arch_tower_desert', 'arch_tower_badlands',
    # Universal (6)
    'arch_fence_all', 'arch_road_cobble', 'arch_barricade_all', 'arch_trench_all', 'arch_railtrack_all', 'arch_ladder_all'
]

updated = 0
for item in arch:
    if item['id'] in all_assets:
        item['files'] = {
            'original': f"assets/images/environment/architecture/{item['id']}_original.png"
        }
        updated += 1

with open('tools/environment/architecture.json', 'w') as f:
    json.dump(arch, f, indent=4)

print(f'Updated {updated} architecture assets with file paths')
