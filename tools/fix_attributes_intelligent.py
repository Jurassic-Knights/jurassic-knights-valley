"""
Intelligently assign species, weapon, and role based on character name and sourceDescription.
"""
import json
import os
import re

# Valid species in dropdown (from cardBuilders.js)
ALL_DINOSAUR_SPECIES = [
    'Velociraptor', 'Utahraptor', 'Deinonychus', 'Compsognathus', 'Dilophosaurus',
    'Oviraptor', 'Gallimimus', 'Troodon', 'Microraptor',
    'Allosaurus', 'Carnotaurus', 'Ceratosaurus', 'Baryonyx', 'Suchomimus',
    'Tyrannosaurus Rex', 'Spinosaurus', 'Giganotosaurus', 'Carcharodontosaurus', 'Acrocanthosaurus',
    'Therizinosaurus',
    'Triceratops', 'Styracosaurus', 'Pachyrhinosaurus', 'Centrosaurus', 'Chasmosaurus',
    'Stegosaurus', 'Ankylosaurus', 'Kentrosaurus', 'Polacanthus',
    'Brachiosaurus', 'Diplodocus', 'Argentinosaurus', 'Brontosaurus', 'Apatosaurus',
    'Parasaurolophus', 'Iguanodon', 'Maiasaura', 'Edmontosaurus', 'Corythosaurus',
    'Pachycephalosaurus', 'Stygimoloch'
]

HERBIVORE_SPECIES = [
    'Triceratops', 'Styracosaurus', 'Pachyrhinosaurus', 'Centrosaurus', 'Chasmosaurus',
    'Stegosaurus', 'Ankylosaurus', 'Kentrosaurus', 'Polacanthus',
    'Brachiosaurus', 'Diplodocus', 'Argentinosaurus', 'Brontosaurus', 'Apatosaurus', 'Camarasaurus',
    'Parasaurolophus', 'Iguanodon', 'Maiasaura', 'Edmontosaurus', 'Corythosaurus', 'Lambeosaurus',
    'Pachycephalosaurus', 'Stygimoloch'
]

# Alias mapping for species extraction
SPECIES_ALIASES = {
    'tyrannosaurus': 'Tyrannosaurus Rex',
    't-rex': 'Tyrannosaurus Rex',
    'rex': 'Tyrannosaurus Rex',
    'raptor': 'Velociraptor',
    'compy': 'Compsognathus',
    'dilo': 'Dilophosaurus',
    'carno': 'Carnotaurus',
    'allo': 'Allosaurus',
    'spino': 'Spinosaurus',
    'giga': 'Giganotosaurus',
    'trike': 'Triceratops',
    'stego': 'Stegosaurus',
    'anky': 'Ankylosaurus',
    'brachi': 'Brachiosaurus',
    'para': 'Parasaurolophus',
    'pachy': 'Pachycephalosaurus',
}

def extract_species(name, description, source_file):
    """Extract the correct species from name and description."""
    text = f"{name} {description}".lower()
    
    # First check name directly - if name IS a species, use it
    for species in ALL_DINOSAUR_SPECIES:
        if species.lower() == name.lower():
            return species
    
    # Check aliases in name first
    for alias, species in SPECIES_ALIASES.items():
        if alias in name.lower():
            return species
    
    # Check for species mentioned in description
    for species in ALL_DINOSAUR_SPECIES:
        if species.lower() in text:
            return species
    
    # Check aliases in description
    for alias, species in SPECIES_ALIASES.items():
        if alias in text:
            return species
    
    return None

def extract_weapon(name, description, source_file):
    """Extract weapon type from description for humans/saurians."""
    if source_file not in ['human', 'saurian']:
        return None
    
    text = f"{name} {description}".lower()
    
    # Melee weapons
    melee_keywords = {
        'greatsword': ['greatsword', 'great sword', 'massive sword', 'huge sword'],
        'longsword': ['longsword', 'long sword'],
        'sword': ['sword', 'blade', 'saber'],
        'war_axe': ['war axe', 'great axe', 'massive axe', 'battle axe'],
        'axe': ['axe', 'hatchet'],
        'war_hammer': ['war hammer', 'warhammer', 'massive hammer', 'maul', 'sledgehammer'],
        'mace': ['mace', 'flanged mace'],
        'spear': ['spear', 'pike', 'javelin'],
        'lance': ['lance', 'cavalry lance'],
        'halberd': ['halberd', 'polearm', 'poleaxe'],
        'flail': ['flail', 'chain flail'],
        'knife': ['knife', 'dagger'],
    }
    
    # Ranged weapons
    ranged_keywords = {
        'machine_gun': ['machine gun', 'heavy machine gun', 'belt-fed', 'gatling'],
        'submachine_gun': ['submachine gun', 'smg', 'tommy gun'],
        'sniper_rifle': ['sniper rifle', 'marksman rifle', 'scoped rifle'],
        'shotgun': ['shotgun', 'trench gun', 'scatter gun'],
        'flamethrower': ['flamethrower', 'flame thrower', 'fire weapon'],
        'bazooka': ['bazooka', 'rocket launcher', 'rocket'],
        'rifle': ['rifle', 'bolt-action', 'carbine'],
        'pistol': ['pistol', 'revolver', 'handgun', 'sidearm'],
    }
    
    # Check for ranged first (more specific)
    for weapon, keywords in ranged_keywords.items():
        for kw in keywords:
            if kw in text:
                return weapon
    
    # Check melee
    for weapon, keywords in melee_keywords.items():
        for kw in keywords:
            if kw in text:
                return weapon
    
    return None

def extract_role(name, description, tier):
    """Extract combat role from description."""
    text = f"{name} {description}".lower()
    
    # Heavy indicators
    if any(kw in text for kw in ['heavy armor', 'full plate', 'heavily armored', 'tank', 'juggernaut', 'bulky armor', 'reinforced plate']):
        return 'heavy'
    
    # Light indicators
    if any(kw in text for kw in ['light armor', 'cloth', 'leather', 'scout', 'agile', 'nimble', 'quick', 'fast']):
        return 'light'
    
    # Special indicators
    if any(kw in text for kw in ['ornate', 'elite', 'commander', 'leader', 'captain', 'unique', 'special']):
        return 'special'
    
    # Utility indicators
    if any(kw in text for kw in ['tool', 'engineer', 'medic', 'support', 'utility']):
        return 'utility'
    
    # Default based on tier
    if tier == 1:
        return 'light'
    elif tier == 2:
        return 'medium'
    elif tier == 3:
        return 'heavy'
    else:
        return 'special'

def process_entities(folder):
    """Process all entities in a folder."""
    updated = 0
    for filename in os.listdir(folder):
        if not filename.endswith('.json'):
            continue
        
        filepath = os.path.join(folder, filename)
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
        
        entity_id = data.get('id', '')
        name = data.get('name', '')
        desc = data.get('sourceDescription', '')
        source_file = data.get('sourceFile', '')
        tier = data.get('tier', 1)
        
        modified = False
        
        # Fix species for dinosaur/herbivore/saurian
        if source_file in ['dinosaur', 'herbivore', 'saurian']:
            new_species = extract_species(name, desc, source_file)
            if new_species and new_species != data.get('species'):
                print(f"{entity_id}: species '{data.get('species')}' -> '{new_species}'")
                data['species'] = new_species
                modified = True
        
        # Fix weapon for human/saurian
        if source_file in ['human', 'saurian']:
            new_weapon = extract_weapon(name, desc, source_file)
            if new_weapon and new_weapon != data.get('weaponType'):
                print(f"{entity_id}: weapon '{data.get('weaponType')}' -> '{new_weapon}'")
                data['weaponType'] = new_weapon
                modified = True
        
        # Fix role for human/saurian
        if source_file in ['human', 'saurian']:
            new_role = extract_role(name, desc, tier)
            if new_role and new_role != data.get('role'):
                print(f"{entity_id}: role '{data.get('role')}' -> '{new_role}'")
                data['role'] = new_role
                modified = True
        
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            updated += 1
    
    return updated

if __name__ == '__main__':
    print("=== Processing Enemies ===")
    e_count = process_entities('src/entities/enemies')
    print(f"\nUpdated {e_count} enemies")
    
    print("\n=== Processing Bosses ===")
    b_count = process_entities('src/entities/bosses')
    print(f"\nUpdated {b_count} bosses")
    
    print(f"\n=== Total: {e_count + b_count} entities updated ===")
