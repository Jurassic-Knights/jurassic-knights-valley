import json

# Add "all" biome assets to architecture.json
with open('tools/environment/architecture.json', 'r') as f:
    arch = json.load(f)

all_biome_arch = [
    {
        "id": "arch_fence_all",
        "name": "Iron Fence",
        "type": "architecture",
        "biome": "all",
        "status": "pending",
        "sourceDescription": "wrought iron fence, spear-point tops, rusted patina, military standard",
        "files": {}
    },
    {
        "id": "arch_road_cobble",
        "name": "Cobblestone Road",
        "type": "architecture",
        "biome": "all",
        "status": "pending",
        "sourceDescription": "worn cobblestone path, mortar gaps, wagon-wheel grooves, medieval construction",
        "files": {}
    },
    {
        "id": "arch_barricade_all",
        "name": "Wooden Barricade",
        "type": "architecture",
        "biome": "all",
        "status": "pending",
        "sourceDescription": "military wooden barricade, crossed timber, rope bindings, battlefield construction",
        "files": {}
    },
    {
        "id": "arch_trench_all",
        "name": "Trench Segment",
        "type": "architecture",
        "biome": "all",
        "status": "pending",
        "sourceDescription": "WWI trench wall segment, wooden supports, sandbag reinforcement, mud texture",
        "files": {}
    },
    {
        "id": "arch_railtrack_all",
        "name": "Rail Track",
        "type": "architecture",
        "biome": "all",
        "status": "pending",
        "sourceDescription": "iron rail track segment, wooden sleepers, rusty rails, industrial railway",
        "files": {}
    },
    {
        "id": "arch_ladder_all",
        "name": "Wooden Ladder",
        "type": "architecture",
        "biome": "all",
        "status": "pending",
        "sourceDescription": "tall wooden ladder, rope bindings, worn rungs, military equipment",
        "files": {}
    }
]

arch.extend(all_biome_arch)

with open('tools/environment/architecture.json', 'w') as f:
    json.dump(arch, f, indent=4)

print(f"Added {len(all_biome_arch)} 'all' biome architecture assets")

# Add "all" biome assets to props.json
with open('tools/environment/props.json', 'r') as f:
    props = json.load(f)

all_biome_props = [
    {
        "id": "prop_barrel_water",
        "name": "Water Barrel",
        "type": "prop",
        "biome": "all",
        "status": "pending",
        "sourceDescription": "wooden water barrel, iron bands, tap spigot, water stains",
        "files": {}
    },
    {
        "id": "prop_crate_medical",
        "name": "Medical Crate",
        "type": "prop",
        "biome": "all",
        "status": "pending",
        "sourceDescription": "white medical supply crate, red cross marking, bandage supplies visible",
        "files": {}
    },
    {
        "id": "prop_anvil_all",
        "name": "Blacksmith Anvil",
        "type": "prop",
        "biome": "all",
        "status": "pending",
        "sourceDescription": "heavy iron anvil, worn surface, hammer marks, forge-blackened",
        "files": {}
    },
    {
        "id": "prop_forge_all",
        "name": "Field Forge",
        "type": "prop",
        "biome": "all",
        "status": "pending",
        "sourceDescription": "portable field forge, bellows, coal bin, glowing coals",
        "files": {}
    },
    {
        "id": "prop_cannon_all",
        "name": "Artillery Piece",
        "type": "prop",
        "biome": "all",
        "status": "pending",
        "sourceDescription": "WWI field artillery cannon, iron wheels, brass fittings, ammunition stack",
        "files": {}
    },
    {
        "id": "prop_munitions_all",
        "name": "Shell Stack",
        "type": "prop",
        "biome": "all",
        "status": "pending",
        "sourceDescription": "stacked artillery shells, wooden crate base, brass casings, military ordnance",
        "files": {}
    },
    {
        "id": "prop_flagpole_all",
        "name": "Military Flagpole",
        "type": "prop",
        "biome": "all",
        "status": "pending",
        "sourceDescription": "tall wooden flagpole, rope pulley, tattered military banner, iron base",
        "files": {}
    },
    {
        "id": "prop_bench_all",
        "name": "Wooden Bench",
        "type": "prop",
        "biome": "all",
        "status": "pending",
        "sourceDescription": "simple wooden bench, worn seat, military camp furniture",
        "files": {}
    },
    {
        "id": "prop_table_all",
        "name": "Command Table",
        "type": "prop",
        "biome": "all",
        "status": "pending",
        "sourceDescription": "wooden command table, map surface, tactical markers, field equipment",
        "files": {}
    },
    {
        "id": "prop_rack_weapons",
        "name": "Weapon Rack",
        "type": "prop",
        "biome": "all",
        "status": "pending",
        "sourceDescription": "wooden weapon rack, pegs for rifles, sword hooks, military armory",
        "files": {}
    },
    {
        "id": "prop_sack_all",
        "name": "Supply Sack",
        "type": "prop",
        "biome": "all",
        "status": "pending",
        "sourceDescription": "burlap supply sack, rope tie, bulging contents, grain or supplies",
        "files": {}
    },
    {
        "id": "prop_stretcher_all",
        "name": "Field Stretcher",
        "type": "prop",
        "biome": "all",
        "status": "pending",
        "sourceDescription": "canvas field stretcher, wooden poles, medical equipment, battlefield use",
        "files": {}
    }
]

props.extend(all_biome_props)

with open('tools/environment/props.json', 'w') as f:
    json.dump(props, f, indent=4)

print(f"Added {len(all_biome_props)} 'all' biome prop assets")
print(f"\nTotal: Architecture has {len(arch)} assets, Props has {len(props)} assets")
