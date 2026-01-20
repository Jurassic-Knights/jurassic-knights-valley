"""Fix saurian species to match dropdown options"""
import json
import os

# Mapping from custom names to actual species in dropdown
species_map = {
    'Raptor Scout': 'Velociraptor',
    'Raptor Tracker': 'Velociraptor',
    'Velociraptor Soldier': 'Velociraptor',
    'Dilo Sniper': 'Dilophosaurus',
    'Raptor Berserker': 'Velociraptor',
    'Carno Shock Trooper': 'Carnotaurus',
    'Rex Commander': 'Tyrannosaurus Rex',
    'Allo Warlord': 'Allosaurus',
    'Spino Enforcer': 'Spinosaurus',
}

enemies_dir = 'src/entities/enemies'
updated = 0

for filename in os.listdir(enemies_dir):
    if not filename.endswith('.json'):
        continue
    filepath = os.path.join(enemies_dir, filename)
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
    
    if data.get('sourceFile') != 'saurian':
        continue
    
    current = data.get('species', '')
    if current in species_map:
        new_species = species_map[current]
        data['species'] = new_species
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print(f"{data['id']}: {current} -> {new_species}")
        updated += 1

print(f"\nUpdated {updated} saurians")
