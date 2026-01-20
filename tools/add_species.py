"""
Add species field to boss and enemy JSONs for dinosaurs, saurians, and herbivores.
The species name will be used in sourceDescription for image generation.
"""
import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTITIES_DIR = os.path.join(BASE_DIR, 'src', 'entities')

# Map boss names to their species (for dinosaurs, saurians, herbivores)
BOSS_SPECIES = {
    # Dinosaurs
    'boss_dinosaur_t2_02': 'Utahraptor',
    'boss_dinosaur_t3_02': 'Allosaurus',
    'boss_dinosaur_t4_01': 'Velociraptor',
    'boss_dinosaur_t4_02': 'Tyrannosaurus Rex',
    'boss_dinosaur_t4_03': 'Spinosaurus',
    # Herbivores
    'boss_herbivore_t4_01': 'Diplodocus',
    'boss_herbivore_t4_02': 'Argentinosaurus',
    # Saurians (mounted warriors)
    'boss_saurian_t4_01': 'Tyrannosaurus Rex',
    'boss_saurian_t4_02': 'Spinosaurus',
}

def add_species_to_bosses():
    """Add species field to boss JSONs."""
    bosses_dir = os.path.join(ENTITIES_DIR, 'bosses')
    updated = 0
    
    for filename in os.listdir(bosses_dir):
        if not filename.endswith('.json'):
            continue
        
        filepath = os.path.join(bosses_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8-sig') as f:
                entity = json.load(f)
            
            entity_id = entity.get('id')
            source_file = entity.get('sourceFile', '')
            
            # Only add species for dinosaurs, saurians, herbivores
            if source_file in ['dinosaur', 'saurian', 'herbivore']:
                if entity_id in BOSS_SPECIES:
                    entity['species'] = BOSS_SPECIES[entity_id]
                elif not entity.get('species'):
                    # Use name as fallback species if not in map
                    entity['species'] = entity.get('name', 'Unknown')
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(entity, f, indent=4)
                    f.write('\n')
                
                print(f"Added species '{entity.get('species')}' to {entity_id}")
                updated += 1
                
        except Exception as e:
            print(f"Error processing {filepath}: {e}")
    
    return updated


def add_species_to_enemies():
    """Add species field to enemy JSONs (dinosaurs, saurians, herbivores)."""
    enemies_dir = os.path.join(ENTITIES_DIR, 'enemies')
    updated = 0
    
    for filename in os.listdir(enemies_dir):
        if not filename.endswith('.json'):
            continue
        
        filepath = os.path.join(enemies_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8-sig') as f:
                entity = json.load(f)
            
            source_file = entity.get('sourceFile', '')
            
            # Only add species for dinosaurs, saurians, herbivores
            if source_file in ['dinosaur', 'saurian', 'herbivore']:
                if not entity.get('species'):
                    # Use entity name as species (enemies already have species-like names)
                    entity['species'] = entity.get('name', 'Unknown')
                    
                    with open(filepath, 'w', encoding='utf-8') as f:
                        json.dump(entity, f, indent=4)
                        f.write('\n')
                    
                    print(f"Added species '{entity.get('species')}' to {entity.get('id')}")
                    updated += 1
                
        except Exception as e:
            print(f"Error processing {filepath}: {e}")
    
    return updated


if __name__ == '__main__':
    print("=== Adding species to bosses ===")
    boss_count = add_species_to_bosses()
    
    print("\n=== Adding species to enemies ===")
    enemy_count = add_species_to_enemies()
    
    print(f"\n=== Done! Updated {boss_count} bosses and {enemy_count} enemies ===")
