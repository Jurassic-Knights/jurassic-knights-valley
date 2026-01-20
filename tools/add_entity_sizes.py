#!/usr/bin/env python3
"""
Add species-based size scales to all enemy and boss entity JSONs.
Sizes are based on species (dinosaurs/herbivores/saurians) or body type (humans).
"""

import json
from pathlib import Path

ENTITIES_DIR = Path(__file__).parent.parent / "src" / "entities"

# Species-to-scale mapping for dinosaurs (carnivores)
DINOSAUR_SCALES = {
    # Small/Fast
    'Compsognathus': 0.6,
    'Microraptor': 0.5,
    'Troodon': 0.7,
    'Oviraptor': 0.8,
    'Velociraptor': 0.9,
    'Gallimimus': 1.0,
    'Dilophosaurus': 1.0,
    'Deinonychus': 1.0,
    # Medium
    'Ceratosaurus': 1.2,
    'Baryonyx': 1.3,
    'Suchomimus': 1.3,
    'Carnotaurus': 1.3,
    'Allosaurus': 1.4,
    # Large
    'Utahraptor': 1.5,
    'Therizinosaurus': 1.6,
    'Acrocanthosaurus': 1.8,
    'Tyrannosaurus Rex': 2.0,
    'Giganotosaurus': 2.0,
    'Carcharodontosaurus': 2.0,
    'Spinosaurus': 2.2,
}

# Species-to-scale mapping for herbivores
HERBIVORE_SCALES = {
    # Medium
    'Pachycephalosaurus': 0.9,
    'Stygimoloch': 0.8,
    'Iguanodon': 1.0,
    'Maiasaura': 1.0,
    'Parasaurolophus': 1.1,
    'Corythosaurus': 1.1,
    'Edmontosaurus': 1.2,
    'Lambeosaurus': 1.1,
    # Medium-Large (horned)
    'Centrosaurus': 1.2,
    'Chasmosaurus': 1.3,
    'Styracosaurus': 1.3,
    'Pachyrhinosaurus': 1.3,
    # Large (armored)
    'Kentrosaurus': 1.2,
    'Polacanthus': 1.3,
    'Stegosaurus': 1.4,
    'Ankylosaurus': 1.4,
    # Large (horned)
    'Triceratops': 1.5,
    # Huge (sauropods)
    'Camarasaurus': 2.0,
    'Apatosaurus': 2.2,
    'Brontosaurus': 2.2,
    'Diplodocus': 2.3,
    'Brachiosaurus': 2.5,
    'Argentinosaurus': 3.0,
}

# Saurians use dinosaur scales since they're anthropomorphic dinosaurs
SAURIAN_SCALES = {**DINOSAUR_SCALES, **HERBIVORE_SCALES}

# Human body type scales
HUMAN_BODY_SCALES = {
    'skinny': 0.9,
    'medium': 1.0,
    'fat': 1.15,
    'muscle': 1.25,
}

# Base sizes by category (before scaling)
BASE_SIZES = {
    'human': 96,
    'dinosaur': 128,
    'saurian': 128,
    'herbivore': 160,
}

# Boss size multiplier (bosses are larger than regular enemies)
BOSS_MULTIPLIER = 1.4


def get_scale_for_entity(entity_data, is_boss=False):
    """Determine the sizeScale for an entity based on species or body type."""
    source_file = entity_data.get('sourceFile', '')
    species = entity_data.get('species', '')
    body_type = entity_data.get('bodyType', 'medium')
    
    scale = 1.0  # Default
    
    if source_file == 'human':
        scale = HUMAN_BODY_SCALES.get(body_type, 1.0)
    elif source_file == 'dinosaur':
        scale = DINOSAUR_SCALES.get(species, 1.0)
    elif source_file == 'herbivore':
        scale = HERBIVORE_SCALES.get(species, 1.0)
    elif source_file == 'saurian':
        scale = SAURIAN_SCALES.get(species, 1.0)
    
    # Apply boss multiplier if applicable
    if is_boss:
        scale *= BOSS_MULTIPLIER
    
    return round(scale, 2)


def get_base_size(source_file):
    """Get the base size for a category."""
    return BASE_SIZES.get(source_file, 128)


def update_entity_file(file_path, is_boss=False):
    """Update an entity JSON file with sizeScale and calculated dimensions."""
    with open(file_path, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
    
    entity_id = data.get('id', file_path.stem)
    source_file = data.get('sourceFile', 'dinosaur')
    
    # Calculate scale based on species/body type
    scale = get_scale_for_entity(data, is_boss)
    base_size = get_base_size(source_file)
    
    # Calculate final dimensions
    final_size = int(base_size * scale)
    
    # Update display block
    data['display'] = {
        'sizeScale': scale,
        'width': final_size,
        'height': final_size
    }
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    
    species_or_body = data.get('species') or data.get('bodyType', 'medium')
    print(f"  {entity_id}: {species_or_body} -> scale={scale}, size={final_size}x{final_size}")
    return True


def main():
    enemies_dir = ENTITIES_DIR / "enemies"
    bosses_dir = ENTITIES_DIR / "bosses"
    
    updated = 0
    
    if enemies_dir.exists():
        print("Processing enemies...")
        for file in sorted(enemies_dir.glob("*.json")):
            if update_entity_file(file, is_boss=False):
                updated += 1
    
    if bosses_dir.exists():
        print("\nProcessing bosses...")
        for file in sorted(bosses_dir.glob("*.json")):
            if update_entity_file(file, is_boss=True):
                updated += 1
    
    print(f"\nUpdated {updated} entity files with species-based size scales")


if __name__ == "__main__":
    main()
