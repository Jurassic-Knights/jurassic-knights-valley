"""
Generate unique lore descriptions for each entity.
Lore describes WHO the character is and WHAT they do (narrative, not visual).
"""
import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTITIES_DIR = os.path.join(BASE_DIR, 'src', 'entities')

# Lore templates based on entity type and characteristics
def generate_lore(entity, category):
    """Generate unique lore description with detailed equipment - head to toe."""
    name = entity.get('name', '')
    tier = entity.get('tier', 1)
    biome = entity.get('biome', 'grasslands')
    source_file = entity.get('sourceFile', '')
    species = entity.get('species', '')
    role = entity.get('role', 'medium')
    weapon_type = entity.get('weaponType', '')
    attack_type = entity.get('combat', {}).get('attackType', 'melee')
    gender = entity.get('gender', 'male')
    body_type = entity.get('bodyType', 'medium')
    is_boss = category == 'bosses' or entity.get('isBoss', False)
    
    # Biome-specific uniform colors and materials
    biome_uniforms = {
        'grasslands': ('olive drab wool', 'brown leather', 'brass'),
        'tundra': ('white-grey fur-lined', 'pale leather', 'silver'),
        'desert': ('sand tan linen', 'sun-bleached leather', 'bronze'),
        'badlands': ('charcoal grey', 'blackened leather', 'iron')
    }
    uniform_color, leather_type, metal_type = biome_uniforms.get(biome, biome_uniforms['grasslands'])
    
    # Role-based armor weight
    role_armor = {
        'light': f'minimal protection - {leather_type} vest over {uniform_color} tunic',
        'medium': f'partial plate - {metal_type} pauldrons and chainmail over {uniform_color} coat',
        'heavy': f'full plate armor - layered {metal_type} plates with {uniform_color} tabard',
        'utility': f'practical gear - tool belts and pouches over {uniform_color} work clothes',
        'special': f'ornate commander armor - gilded {metal_type} with decorated {uniform_color} cape'
    }
    armor_desc = role_armor.get(role, role_armor['medium'])
    
    # Weapon descriptions
    weapon_desc = {
        'sword': 'a cavalry sabre sheathed at the hip',
        'axe': 'a brutal trench axe strapped to the back',
        'spear': 'a reinforced steel pike',
        'mace': 'a flanged trench mace hanging from the belt',
        'pistol': 'a service revolver in a leather holster',
        'rifle': 'a bolt-action rifle with bayonet',
        'shotgun': 'a trench shotgun for close quarters',
        'machine_gun': 'a heavy machine gun with ammunition belt',
        'sniper_rifle': 'a scoped marksman rifle',
        'shotgun': 'a pump-action shotgun with worn grips',
        'shield': 'a reinforced tower shield'
    }
    weapon_text = weapon_desc.get(weapon_type, 'standard military weapons')
    
    # Tier-based experience descriptions
    tier_exp = {1: 'newly conscripted', 2: 'trained regular', 3: 'battle-hardened veteran', 4: 'elite specialist'}
    experience = tier_exp.get(tier, 'soldier')
    
    # Generate based on source type
    if source_file == 'human':
        # Head coverings based on biome
        head_covers = {
            'grasslands': 'a stahlhelm with face guard',
            'tundra': 'a fur-lined hood over a steel helmet',
            'desert': 'a cloth-wrapped helmet with goggles',
            'badlands': 'an iron mask with respirator'
        }
        head = head_covers.get(biome, 'a combat helmet')
        
        if is_boss:
            return f"{name} is a {experience} officer commanding forces in the region. Wears {armor_desc}. Head protected by {head}. Armed with {weapon_text}. A {gender} commander with {body_type} build, distinguished by rank insignia and battle honors. Known for tactical prowess in trench warfare."
        else:
            return f"A {experience} {role} infantry soldier. Wears {armor_desc}. Head protected by {head}. Armed with {weapon_text}. A {gender} with {body_type} build, bearing the weathered look of prolonged combat."
    
    elif source_file == 'saurian':
        # Saurians are anthropomorphic - armor but exposed clawed feet
        if is_boss:
            return f"{name}, a towering anthropomorphic {species} warlord. Wears {armor_desc}, modified for reptilian anatomy. Clawed dinosaur feet remain exposed. Armed with {weapon_text}. Scales show battle scars, eyes gleam with predatory intelligence. Commands through sheer physical dominance."
        else:
            return f"An anthropomorphic {species} warrior of {experience} rank. Wears {armor_desc} adapted for reptilian frame. Clawed dinosaur feet exposed. Armed with {weapon_text}. Combines reptilian strength with military discipline."
    
    elif source_file == 'dinosaur':
        # War-beasts with military barding
        barding_tier = {1: 'light leather straps', 2: 'bronze-plated barding', 3: 'iron war-barding', 4: 'ornate steel plate barding'}
        barding = barding_tier.get(tier, 'military barding')
        
        if is_boss:
            return f"{name}, an alpha {species} war-beast of immense size. Fitted with {barding} bearing military insignia. Hide shows old wounds and battle scars. Teeth razor-sharp, muscles rippling beneath armored plates. The most dangerous predator in the region."
        else:
            return f"A trained {species} war-beast. Fitted with {barding} for combat. Powerful jaws, sharp claws, muscular scaled body. Fast and vicious, responds to handler commands."
    
    elif source_file == 'herbivore':
        # Natural - no armor
        natural_tier = {1: 'young', 2: 'adult', 3: 'mature', 4: 'ancient alpha'}
        age = natural_tier.get(tier, 'wild')
        
        if is_boss:
            return f"{name}, a colossal {age} {species} that dominates the territory. Natural coloring adapted to the environment. Massive build with thick hide, powerful enough to crush anything in its path. Peaceful unless provoked, then devastatingly dangerous."
        else:
            return f"A {age} {species} grazing naturally. No armor or equipment - pure wild dinosaur. Hide colored for natural camouflage. Will flee if threatened, but fights back if cornered."
    
    elif category == 'npcs':
        # NPCs have their own head covers
        npc_head = {'grasslands': 'a stahlhelm', 'tundra': 'a fur hood', 'desert': 'a headwrap', 'badlands': 'a gas mask'}
        return f"A traveling merchant who supplies soldiers and survivors throughout the war-torn lands. Wears practical {uniform_color} traveling clothes with {leather_type} pouches for trade goods. Face covered by {npc_head.get(biome, 'a protective mask')} for protection. Armed with a sidearm for self-defense."
    
    else:
        return f"{name} - combatant in the ongoing conflict."


def update_entity_lore(category, force=False):
    """Update all entities in category with lore descriptions."""
    cat_dir = os.path.join(ENTITIES_DIR, category)
    if not os.path.exists(cat_dir):
        print(f"Category not found: {category}")
        return 0
    
    count = 0
    for filename in sorted(os.listdir(cat_dir)):
        if not filename.endswith('.json'):
            continue
        
        filepath = os.path.join(cat_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            entity = json.load(f)
        
        # Skip if has description and not forcing
        if entity.get('description') and not force:
            continue
        
        lore = generate_lore(entity, category)
        entity['description'] = lore
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(entity, f, indent=4)
        
        print(f"Added lore for {entity.get('id', filename)}")
        count += 1
    
    return count


if __name__ == '__main__':
    import sys
    force = '--force' in sys.argv
    if force:
        print("=== FORCE Regenerating ALL Lore Descriptions ===\n")
    else:
        print("=== Generating Lore Descriptions (new only) ===\n")
    
    total = 0
    for category in ['enemies', 'bosses', 'npcs']:
        print(f"\n=== {category.upper()} ===")
        total += update_entity_lore(category, force=force)
    
    print(f"\n=== Done! Updated lore for {total} entities ===")
