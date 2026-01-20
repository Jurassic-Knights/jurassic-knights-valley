"""
Batch create missing enemies and bosses.
"""
import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENEMIES_DIR = os.path.join(BASE_DIR, 'src', 'entities', 'enemies')
BOSSES_DIR = os.path.join(BASE_DIR, 'src', 'entities', 'bosses')

# Missing enemies to create
MISSING_ENEMIES = [
    # Dinosaur T2_02, T3_02
    {"id": "enemy_dinosaur_t2_02", "name": "Stalker", "sourceFile": "dinosaur", "tier": 2, "biome": "tundra", "species": "Baryonyx",
     "stats": {"health": 60, "damage": 8, "speed": 90, "defense": 0}},
    {"id": "enemy_dinosaur_t3_02", "name": "Razorclaw", "sourceFile": "dinosaur", "tier": 3, "biome": "desert", "species": "Allosaurus",
     "stats": {"health": 100, "damage": 14, "speed": 85, "defense": 0}},
    # Dinosaur T4
    {"id": "enemy_dinosaur_t4_01", "name": "Alpha Raptor", "sourceFile": "dinosaur", "tier": 4, "biome": "badlands", "species": "Utahraptor",
     "stats": {"health": 150, "damage": 20, "speed": 110, "defense": 0}},
    {"id": "enemy_dinosaur_t4_02", "name": "Apex Hunter", "sourceFile": "dinosaur", "tier": 4, "biome": "badlands", "species": "Giganotosaurus",
     "stats": {"health": 200, "damage": 25, "speed": 70, "defense": 0}},
    {"id": "enemy_dinosaur_t4_03", "name": "Spined Terror", "sourceFile": "dinosaur", "tier": 4, "biome": "badlands", "species": "Spinosaurus",
     "stats": {"health": 180, "damage": 22, "speed": 80, "defense": 0}},
    # Herbivore T3_03, T4
    {"id": "enemy_herbivore_t3_03", "name": "Charging Bull", "sourceFile": "herbivore", "tier": 3, "biome": "desert", "species": "Styracosaurus",
     "stats": {"health": 120, "damage": 12, "speed": 75, "defense": 0}},
    {"id": "enemy_herbivore_t4_01", "name": "Titan", "sourceFile": "herbivore", "tier": 4, "biome": "badlands", "species": "Argentinosaurus",
     "stats": {"health": 250, "damage": 18, "speed": 40, "defense": 0}},
    {"id": "enemy_herbivore_t4_02", "name": "Armored Fury", "sourceFile": "herbivore", "tier": 4, "biome": "badlands", "species": "Ankylosaurus",
     "stats": {"health": 200, "damage": 15, "speed": 50, "defense": 0}},
    {"id": "enemy_herbivore_t4_03", "name": "Horn Lord", "sourceFile": "herbivore", "tier": 4, "biome": "badlands", "species": "Triceratops",
     "stats": {"health": 220, "damage": 20, "speed": 60, "defense": 0}},
    # Human T4
    {"id": "enemy_human_t4_01", "name": "Assault Trooper", "sourceFile": "human", "tier": 4, "biome": "badlands", 
     "gender": "male", "bodyType": "muscle", "stats": {"health": 140, "damage": 18, "speed": 70, "defense": 0}},
    {"id": "enemy_human_t4_02", "name": "Stormbreaker", "sourceFile": "human", "tier": 4, "biome": "badlands",
     "gender": "female", "bodyType": "medium", "stats": {"health": 120, "damage": 22, "speed": 85, "defense": 0}},
    {"id": "enemy_human_t4_03", "name": "War Veteran", "sourceFile": "human", "tier": 4, "biome": "badlands",
     "gender": "male", "bodyType": "fat", "stats": {"health": 180, "damage": 15, "speed": 55, "defense": 0}},
    # Saurian T4
    {"id": "enemy_saurian_t4_01", "name": "Raptor Elite", "sourceFile": "saurian", "tier": 4, "biome": "badlands", "species": "Velociraptor",
     "stats": {"health": 130, "damage": 20, "speed": 100, "defense": 0}},
    {"id": "enemy_saurian_t4_02", "name": "Rex Commander", "sourceFile": "saurian", "tier": 4, "biome": "badlands", "species": "Tyrannosaurus Rex",
     "stats": {"health": 200, "damage": 25, "speed": 65, "defense": 0}},
    {"id": "enemy_saurian_t4_03", "name": "Spino Warlord", "sourceFile": "saurian", "tier": 4, "biome": "badlands", "species": "Spinosaurus",
     "stats": {"health": 180, "damage": 22, "speed": 75, "defense": 0}},
]

# Missing bosses to create
MISSING_BOSSES = [
    # Dinosaur T1, T2_01, T3_01
    {"id": "boss_dinosaur_t1_01", "name": "Pack Leader", "sourceFile": "dinosaur", "tier": 1, "biome": "grasslands", "species": "Velociraptor",
     "stats": {"health": 80, "damage": 8, "speed": 100, "defense": 0}},
    {"id": "boss_dinosaur_t1_02", "name": "Nest Guardian", "sourceFile": "dinosaur", "tier": 1, "biome": "grasslands", "species": "Dilophosaurus",
     "stats": {"health": 90, "damage": 10, "speed": 90, "defense": 0}},
    {"id": "boss_dinosaur_t2_01", "name": "Territorial Alpha", "sourceFile": "dinosaur", "tier": 2, "biome": "tundra", "species": "Carnotaurus",
     "stats": {"health": 120, "damage": 15, "speed": 85, "defense": 0}},
    {"id": "boss_dinosaur_t3_01", "name": "Desert Tyrant", "sourceFile": "dinosaur", "tier": 3, "biome": "desert", "species": "Allosaurus",
     "stats": {"health": 160, "damage": 20, "speed": 80, "defense": 0}},
    # Human T1-T3
    {"id": "boss_human_t1_01", "name": "Squad Leader", "sourceFile": "human", "tier": 1, "biome": "grasslands",
     "gender": "male", "bodyType": "medium", "stats": {"health": 100, "damage": 10, "speed": 75, "defense": 0}},
    {"id": "boss_human_t1_02", "name": "Frontline Captain", "sourceFile": "human", "tier": 1, "biome": "grasslands",
     "gender": "female", "bodyType": "muscle", "stats": {"health": 110, "damage": 12, "speed": 70, "defense": 0}},
    {"id": "boss_human_t2_01", "name": "Battalion Commander", "sourceFile": "human", "tier": 2, "biome": "tundra",
     "gender": "male", "bodyType": "muscle", "stats": {"health": 140, "damage": 15, "speed": 70, "defense": 0}},
    {"id": "boss_human_t2_02", "name": "Frost Sergeant", "sourceFile": "human", "tier": 2, "biome": "tundra",
     "gender": "female", "bodyType": "medium", "stats": {"health": 130, "damage": 14, "speed": 75, "defense": 0}},
    {"id": "boss_human_t3_01", "name": "Desert General", "sourceFile": "human", "tier": 3, "biome": "desert",
     "gender": "male", "bodyType": "fat", "stats": {"health": 170, "damage": 18, "speed": 60, "defense": 0}},
    {"id": "boss_human_t3_02", "name": "Sand Viper", "sourceFile": "human", "tier": 3, "biome": "desert",
     "gender": "female", "bodyType": "skinny", "stats": {"health": 140, "damage": 20, "speed": 85, "defense": 0}},
    # Saurian T1-T3
    {"id": "boss_saurian_t1_01", "name": "Scout Captain", "sourceFile": "saurian", "tier": 1, "biome": "grasslands", "species": "Gallimimus",
     "stats": {"health": 90, "damage": 8, "speed": 110, "defense": 0}},
    {"id": "boss_saurian_t1_02", "name": "Claw Sergeant", "sourceFile": "saurian", "tier": 1, "biome": "grasslands", "species": "Deinonychus",
     "stats": {"health": 100, "damage": 10, "speed": 95, "defense": 0}},
    {"id": "boss_saurian_t2_01", "name": "Frost Raider", "sourceFile": "saurian", "tier": 2, "biome": "tundra", "species": "Utahraptor",
     "stats": {"health": 130, "damage": 14, "speed": 90, "defense": 0}},
    {"id": "boss_saurian_t2_02", "name": "Ice Stalker", "sourceFile": "saurian", "tier": 2, "biome": "tundra", "species": "Baryonyx",
     "stats": {"health": 140, "damage": 15, "speed": 85, "defense": 0}},
    {"id": "boss_saurian_t3_01", "name": "Dune Warlord", "sourceFile": "saurian", "tier": 3, "biome": "desert", "species": "Carnotaurus",
     "stats": {"health": 160, "damage": 18, "speed": 80, "defense": 0}},
    {"id": "boss_saurian_t3_02", "name": "Sand Crusher", "sourceFile": "saurian", "tier": 3, "biome": "desert", "species": "Pachycephalosaurus",
     "stats": {"health": 150, "damage": 20, "speed": 75, "defense": 0}},
]


def create_enemy(data):
    """Create an enemy JSON file."""
    entity_id = data['id']
    tier = data['tier']
    source_file = data['sourceFile']
    sprite_id = entity_id.replace('enemy_', '')
    
    entity = {
        "id": entity_id,
        "name": data['name'],
        "sourceCategory": "enemies",
        "sourceFile": source_file,
        "sprite": sprite_id,
        "status": "pending",
        "files": {
            "original": f"assets/images/enemies/{sprite_id}_original.png"
        },
        "tier": tier,
        "biome": data['biome'],
        "stats": data['stats'],
        "combat": {
            "attackRange": 100 if source_file != 'human' else 400,
            "attackRate": 1.5,
            "aggroRange": 250,
            "packAggro": tier < 3,
            "attackType": "ranged" if source_file == 'human' else "melee"
        },
        "sfx": {
            "spawn": f"sfx_spawn_{sprite_id}",
            "death": f"sfx_death_{sprite_id}",
            "hurt": f"sfx_hurt_{sprite_id}",
            "aggro": f"sfx_aggro_{sprite_id}"
        },
        "spawning": {
            "biomes": [data['biome']],
            "groupSize": [1, 2] if tier >= 3 else [2, 4],
            "weight": 50,
            "respawnTime": 30
        },
        "loot": [
            {"item": f"minerals_t{tier}_01", "chance": 0.7, "amount": [1, 2]},
            {"item": f"salvage_t{tier}_01", "chance": 0.3, "amount": [1, 1]}
        ],
        "xpReward": tier * 15
    }
    
    # Add species for dinosaurs/saurians/herbivores
    if data.get('species'):
        entity['species'] = data['species']
    
    # Add gender/bodyType for humans
    if data.get('gender'):
        entity['gender'] = data['gender']
    if data.get('bodyType'):
        entity['bodyType'] = data['bodyType']
    
    filepath = os.path.join(ENEMIES_DIR, f"{entity_id}.json")
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(entity, f, indent=4)
        f.write('\n')
    print(f"Created enemy: {entity_id}")


def create_boss(data):
    """Create a boss JSON file."""
    entity_id = data['id']
    tier = data['tier']
    source_file = data['sourceFile']
    sprite_id = entity_id.replace('boss_', '')
    
    entity = {
        "id": entity_id,
        "name": data['name'],
        "sourceCategory": "bosses",
        "sourceFile": source_file,
        "sprite": sprite_id,
        "status": "pending",
        "files": {
            "original": f"assets/images/enemies/{sprite_id}_original.png"
        },
        "tier": tier,
        "biome": data['biome'],
        "stats": data['stats'],
        "combat": {
            "attackRange": 100 if source_file != 'human' else 400,
            "attackRate": 1.5,
            "aggroRange": 280,
            "packAggro": True,
            "attackType": "ranged" if source_file == 'human' else "melee"
        },
        "sfx": {
            "spawn": f"sfx_spawn_{sprite_id}",
            "death": f"sfx_death_{sprite_id}",
            "hurt": f"sfx_hurt_{sprite_id}",
            "aggro": f"sfx_aggro_{sprite_id}"
        },
        "spawning": {
            "biomes": [data['biome']],
            "groupSize": [1, 1],
            "weight": 25,
            "respawnTime": 60
        },
        "loot": [
            {"item": f"minerals_t{tier}_01", "chance": 1.0, "amount": [2, 4]},
            {"item": f"leather_t{tier}_01", "chance": 0.8, "amount": [1, 2]}
        ],
        "xpReward": tier * 30,
        "isBoss": True
    }
    
    # Add species for dinosaurs/saurians/herbivores
    if data.get('species'):
        entity['species'] = data['species']
    
    # Add gender/bodyType for humans
    if data.get('gender'):
        entity['gender'] = data['gender']
    if data.get('bodyType'):
        entity['bodyType'] = data['bodyType']
    
    filepath = os.path.join(BOSSES_DIR, f"{entity_id}.json")
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(entity, f, indent=4)
        f.write('\n')
    print(f"Created boss: {entity_id}")


if __name__ == '__main__':
    print("=== Creating Missing Enemies ===")
    for enemy in MISSING_ENEMIES:
        create_enemy(enemy)
    
    print("\n=== Creating Missing Bosses ===")
    for boss in MISSING_BOSSES:
        create_boss(boss)
    
    print(f"\n=== Done! Created {len(MISSING_ENEMIES)} enemies and {len(MISSING_BOSSES)} bosses ===")
