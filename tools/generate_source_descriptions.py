"""
Generate proper sourceDescriptions based on entity category and context.
Describes VISUAL APPEARANCE for image generation
"""
import os
import json
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTITIES_DIR = os.path.join(BASE_DIR, 'src', 'entities')


def get_tier(entity):
    """Extract tier from entity, checking tier field first, then ID pattern."""
    if entity.get('tier'):
        return entity.get('tier')
    # Try to extract from ID pattern: *_t#_*
    entity_id = entity.get('id', '')
    match = re.search(r'_t(\d)_', entity_id)
    if match:
        return int(match.group(1))
    return 1

# Category-specific description templates
def generate_item_description(entity):
    """Generate description for items (crafting materials) - use name as primary keyword."""
    tier = get_tier(entity)
    name = entity.get('name', '').lower()
    category = entity.get('sourceFile', 'item')  # bone, leather, mechanical, metal, wood
    
    tier_visual = {1: 'simple rough', 2: 'refined crafted', 3: 'polished quality', 4: 'ornate premium'}
    tier_adj = tier_visual.get(tier, 'standard')
    
    # Category-specific visual context
    category_context = {
        'bone': 'pale off-white weathered texture, gritty surface',
        'leather': 'tanned brown hide material, stitched edges',
        'mechanical': 'bronze gears and metal parts, industrial texture',
        'metal': 'polished metallic surface, forged shape',
        'wood': 'natural wood grain texture, carved surface'
    }
    
    context = category_context.get(category, 'crafting material texture')
    return f"{tier_adj} {name}, {context}, game inventory icon"


def generate_resource_description(entity):
    """Generate description for resources (drops from nodes/enemies) - use name as keyword."""
    tier = get_tier(entity)
    name = entity.get('name', '').lower()
    category = entity.get('sourceFile', 'resource')  # food, minerals, salvage, scraps
    
    tier_visual = {1: 'simple common', 2: 'quality refined', 3: 'rare valuable', 4: 'precious exotic'}
    tier_adj = tier_visual.get(tier, 'standard')
    
    category_context = {
        'food': 'edible consumable, fresh organic appearance',
        'minerals': 'crystalline rock formation, metallic veins visible',
        'salvage': 'recovered machine parts, rusted metal debris',
        'scraps': 'discarded debris, weathered broken parts'
    }
    
    context = category_context.get(category, 'resource material')
    return f"{tier_adj} {name}, {context}, game drop sprite"


def generate_enemy_description(entity):
    """
    Generate description for enemies with proper variety.
    Uses role for armor style, weapon, gender, bodyType.
    Varies face coverings instead of always 'iron mask'.
    """
    tier = get_tier(entity)
    biome = entity.get('biome', 'grasslands')
    source_file = entity.get('sourceFile', 'dinosaur')
    species = entity.get('species', '')
    name = entity.get('name', '')
    role = entity.get('role', 'medium')
    entity_id = entity.get('id', '')
    
    # Get weapon type
    weapon_type = entity.get('weaponType', '')
    weapon_display = weapon_type.replace('_', ' ') if weapon_type else ''
    
    # Hash-based selection for consistent variety
    hash_val = hash(entity_id) % 100
    
    # Role-based armor descriptions (WWI military fusion)
    role_armor = {
        'light': ['leather vest', 'cloth wraps', 'hooded cloak', 'bandolier', 'light padding'],
        'medium': ['chain mail sections', 'partial plate armor', 'reinforced leather', 'iron pauldrons'],
        'heavy': ['full plate armor', 'layered steel plates', 'heavy boots', 'thick iron gauntlets'],
        'utility': ['tool pouches', 'work belts', 'goggles', 'practical gear', 'equipment straps'],
        'special': ['officer-grade plate armor', 'rank insignia badges', 'brass-trimmed shoulder guards', 'polished steel']
    }
    armor_options = role_armor.get(role, role_armor['medium'])
    armor_style = armor_options[hash_val % len(armor_options)]
    
    # Varied face coverings based on biome and hash
    face_coverings = {
        'grasslands': ['stahlhelm with face guard', 'combat helmet with visor', 'medieval war helm'],
        'tundra': ['hooded mask', 'fur-lined helm', 'leather hood with goggles'],
        'desert': ['cloth-wrapped face', 'goggles and headwrap', 'desert visor'],
        'badlands': ['iron mask', 'skull visor', 'riveted faceplate', 'respirator mask']
    }
    biome_faces = face_coverings.get(biome, face_coverings['grasslands'])
    face = biome_faces[(hash_val // 10) % len(biome_faces)]
    
    # Biome color palette
    biome_colors = {
        'grasslands': 'brown and tan',
        'tundra': 'white and grey',
        'desert': 'sand tan and cream',
        'badlands': 'charred brown and rust orange'
    }
    colors = biome_colors.get(biome, 'military colors')
    
    if source_file == 'dinosaur' and species:
        # WWI military-style dinosaur barding with industrial elements
        tier_barding = {
            1: 'leather harness with ammunition pouches',
            2: 'bronze barding with trench spikes',
            3: 'iron barding with gas mask attachment',
            4: 'reinforced steel barding with mounted machine gun bracket'
        }
        return f"{species}, {colors} coloring, {tier_barding.get(tier, 'standard barding')}, razor teeth visible, muscular scaled body"
    
    elif source_file == 'herbivore' and species:
        # Herbivores use NATURAL colorings - no armor, no equipment
        # Multiple color options per biome using actual color descriptions
        natural_colors = {
            'grasslands': [
                'green-brown hide with darker stripes',
                'earthy brown body with tan underbelly',
                'olive green with cream markings',
                'mottled brown and grey pattern',
                'forest green with tan patches',
                'dark brown body with lighter flanks',
                'muddy brown and olive coloring',
                'grey-green with brown spots'
            ],
            'tundra': [
                'white and pale grey hide',
                'cream colored with grey markings',
                'pale white body with grey patches',
                'light grey and white pattern',
                'off-white with pale brown tones',
                'silvery grey coloring',
                'pale cream and grey hide',
                'white body with grey-brown spots'
            ],
            'desert': [
                'sandy tan and cream hide',
                'pale brown with tan stripes',
                'dusty beige coloring',
                'light tan body with cream underbelly',
                'golden brown and sand colored',
                'pale yellow-tan hide',
                'faded brown and cream pattern',
                'sandy beige with darker markings'
            ],
            'badlands': [
                'dark grey and black hide',
                'charcoal grey with rust-brown patches',
                'mottled black and grey coloring',
                'dark brown-grey body',
                'smoky grey with black markings',
                'volcanic grey and dark brown',
                'ash grey body with darker stripes',
                'deep grey with reddish-brown tones'
            ]
        }
        color_options = natural_colors.get(biome, natural_colors['grasslands'])
        natural_color = color_options[hash_val % len(color_options)]
        return f"{species}, {natural_color}, bulky natural build"
    
    elif source_file == 'saurian' and species:
        weapon_part = f", {weapon_display}" if weapon_display else ''
        return f"anthropomorphic {species}, {colors} uniform, {armor_style}{weapon_part}, clawed dinosaur feet exposed"
    
    elif source_file == 'human':
        gender = entity.get('gender', 'male')
        body = entity.get('bodyType', 'medium')
        weapon_part = f", {weapon_display}" if weapon_display else ''
        return f"{gender} soldier, {body} build, {colors} uniform, {armor_style}, {face}{weapon_part}"
    
    else:
        return f"{name}, {colors} coloring"


def generate_boss_description(entity):
    """
    Generate description for bosses - equipment only, no 'boss encounter' text.
    Uses role, weapon, species for varied descriptions.
    """
    tier = get_tier(entity)
    biome = entity.get('biome', 'grasslands')
    source_file = entity.get('sourceFile', 'dinosaur')
    species = entity.get('species', '')
    role = entity.get('role', 'special')
    entity_id = entity.get('id', '')
    
    weapon_type = entity.get('weaponType', '')
    weapon_display = weapon_type.replace('_', ' ') if weapon_type else ''
    
    # Hash for variety
    hash_val = hash(entity_id) % 100
    
    # Biome colors
    biome_colors = {
        'grasslands': 'brown and tan',
        'tundra': 'white and grey, fur-trimmed',
        'desert': 'sand tan and bronze',
        'badlands': 'charred black and rust'
    }
    colors = biome_colors.get(biome, 'battle-worn colors')
    
    # Role-based boss armor
    role_armor = {
        'heavy': ['full plate armor', 'thick layered steel', 'massive pauldrons'],
        'special': ['officer-grade plate armor', 'officer\'s greatcoat', 'rank insignia']
    }
    armor_options = role_armor.get(role, role_armor['special'])
    armor_style = armor_options[hash_val % len(armor_options)]
    
    # Varied face coverings for bosses (from style guide preferred list)
    boss_faces = [
        'stahlhelm with face guard',
        'medieval war helm',
        'iron mask with rivets',
        'hooded mask with goggles',
        'skull visor',
        'barbuta helmet',
        'combat helmet with visor',
        'sallet helm'
    ]
    face = boss_faces[hash_val % len(boss_faces)]
    
    if source_file == 'dinosaur' and species:
        # WWI military-style boss dinosaur barding with dinosaur skull trophies
        barding_options = [
            'reinforced steel barding with dinosaur skull trophies',
            'riveted plate armor with velociraptor claw necklace',
            'spiked iron barding with ammunition bandoliers',
            'reinforced plate barding with commander rank badges',
            'heavy steel plates with mounted searchlight',
            'industrial-forged bronze barding with brass fittings',
            'battle-worn iron armor with trench spikes',
            'riveted steel barding with painted unit insignia'
        ]
        appearance_options = [
            'massive muscular build, battle scars visible',
            'towering predator, scarred hide',
            'heavily muscled, old wounds visible',
            'dominant alpha build, marked by combat',
            'imposing physique, weathered scales'
        ]
        barding = barding_options[hash_val % len(barding_options)]
        appearance = appearance_options[(hash_val // 10) % len(appearance_options)]
        return f"{species}, {colors} coloring, {barding}, {appearance}"
    
    elif source_file == 'herbivore' and species:
        # Boss herbivores use NATURAL colorings - no armor
        natural_colors = {
            'grasslands': [
                'deep green-brown hide with bold markings',
                'rich earthy brown body with tan underbelly',
                'dark olive green with cream patches',
                'bold brown and grey pattern',
                'forest green with prominent tan stripes',
                'dark brown body with lighter flanks',
                'deep muddy brown and olive coloring',
                'grey-green with distinctive brown spots'
            ],
            'tundra': [
                'pure white and grey hide',
                'cream colored with dark grey markings',
                'pale white body with brown patches',
                'light grey and off-white pattern',
                'white with pale brown tones',
                'silvery grey and white coloring',
                'pale cream and dark grey hide',
                'white body with brown-grey spots'
            ],
            'desert': [
                'deep tan and cream hide',
                'pale brown with darker stripes',
                'dusty golden beige coloring',
                'tan body with cream underbelly',
                'golden brown and sand colored',
                'pale yellow-tan hide',
                'faded tan and cream pattern',
                'sandy brown with darker markings'
            ],
            'badlands': [
                'dark grey and black hide',
                'charcoal grey with rust patches',
                'mottled black and dark grey coloring',
                'deep brown-grey body',
                'dark grey with black markings',
                'grey and dark brown tones',
                'ash grey body with black stripes',
                'deep grey with rust-brown patches'
            ]
        }
        color_options = natural_colors.get(biome, natural_colors['grasslands'])
        natural_color = color_options[hash_val % len(color_options)]
        return f"{species}, {natural_color}, massive towering build"
    
    elif source_file == 'saurian' and species:
        weapon_part = f", {weapon_display}" if weapon_display else ''
        return f"anthropomorphic {species}, {colors} uniform, {armor_style}{weapon_part}, clawed dinosaur feet exposed"
    
    elif source_file == 'human':
        gender = entity.get('gender', 'male')
        body = entity.get('bodyType', 'muscle')
        weapon_part = f", {weapon_display}" if weapon_display else ''
        return f"{gender} commander, {body} build, {colors} uniform, {armor_style}, {face}{weapon_part}"
    
    else:
        return f"elite warrior, {colors}, {armor_style}"


def generate_npc_description(entity):
    """Generate description for NPCs - visual appearance only."""
    npc_type = entity.get('type', 'merchant')
    biome = entity.get('biome', 'all')
    
    biome_visual = {
        'quarry': 'dusty stone-worker appearance',
        'iron': 'soot-covered metalworker look',
        'dead': 'weathered forest ranger style',
        'cross': 'travel-worn wanderer outfit',
        'scrap': 'grease-stained mechanic attire',
        'mud': 'muddy wetlands gear',
        'bone': 'bleached bone-adorned clothing',
        'ruins': 'ancient relic collector garb'
    }
    
    # Try to match biome from entity biome field
    biome_adj = biome_visual.get(biome, 'weathered traveling')
    
    return f"{biome_adj}, trader NPC character, armored medieval merchant, trade goods visible, full helmet per style mandate, detailed pixel art"


def generate_equipment_description(entity):
    """Generate description for equipment (weapons, armor) - use name as primary visual keyword."""
    tier = get_tier(entity)
    name = entity.get('name', '').lower()
    slot = entity.get('slot', entity.get('sourceFile', 'weapon'))
    
    tier_visual = {1: 'worn basic', 2: 'military-grade', 3: 'veteran battle-tested', 4: 'legendary ornate'}
    tier_adj = tier_visual.get(tier, 'standard')
    
    # Use the name as the primary descriptor, add context based on slot
    slot_context = {
        'weapon': 'combat weapon, grip handle visible',
        'head': 'headgear, protective',
        'chest': 'torso garment, body coverage', 
        'hands': 'hand protection, finger coverage',
        'legs': 'leg covering, lower body protection',
        'feet': 'footwear, sturdy construction',
        'signature': 'unique signature item, distinctive design',
        'tool': 'utility implement, functional design'
    }
    
    context = slot_context.get(slot, 'equipment piece')
    return f"{tier_adj} {name}, {context}, WWI-era medieval style, weathered battle-worn texture, game equipment icon"


def update_category(category, generator_func):
    """Update all entities in a category with generated descriptions."""
    cat_dir = os.path.join(ENTITIES_DIR, category)
    if not os.path.exists(cat_dir):
        print(f"Category not found: {category}")
        return 0
    
    updated = 0
    for filename in os.listdir(cat_dir):
        if not filename.endswith('.json'):
            continue
        
        filepath = os.path.join(cat_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8-sig') as f:
                entity = json.load(f)
            
            new_desc = generator_func(entity)
            entity['sourceDescription'] = new_desc
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(entity, f, indent=4)
                f.write('\n')
            
            print(f"Updated {entity.get('id')}: {new_desc[:60]}...")
            updated += 1
            
        except Exception as e:
            print(f"Error processing {filepath}: {e}")
    
    return updated


if __name__ == '__main__':
    total = 0
    
    print("=== Updating Enemies ===")
    total += update_category('enemies', generate_enemy_description)
    
    print("\n=== Updating Bosses ===")
    total += update_category('bosses', generate_boss_description)
    
    print("\n=== Updating Items ===")
    total += update_category('items', generate_item_description)
    
    print("\n=== Updating Resources ===")
    total += update_category('resources', generate_resource_description)
    
    print("\n=== Updating NPCs ===")
    total += update_category('npcs', generate_npc_description)
    
    print("\n=== Updating Equipment ===")
    total += update_category('equipment', generate_equipment_description)
    
    print(f"\n=== Done! Updated {total} entities ===")
