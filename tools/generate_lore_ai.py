"""
AI-Generated Lore Descriptions for Entities
Uses Gemini API to generate unique, detailed 3-paragraph descriptions.
"""
import os
import json
import google.generativeai as genai
import time

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTITIES_DIR = os.path.join(BASE_DIR, 'src', 'entities')

# Configure Gemini
genai.configure(api_key=os.environ.get('GOOGLE_API_KEY', ''))
model = genai.GenerativeModel('gemini-2.0-flash')

STYLE_GUIDE = """
You are writing lore for "Jurassic Knights: Valley", a game with a MEDIEVAL + WWI FUSION aesthetic.

CRITICAL STYLE RULES:
- Gritty, weathered, utilitarian - "Mud, Steel, and Scales"
- All humans must have faces FULLY COVERED (helmets, masks, gas masks, face guards)
- No magic - everything is physical and mechanical
- Dinosaurs are WAR-BEASTS fitted with military barding/armor
- Saurians are ANTHROPOMORPHIC dinosaur warriors (walk upright, use weapons, but have exposed clawed feet)
- Herbivores are WILD - no armor, natural coloring only
- WWI elements: trenches, gas masks, bolt-action rifles, machine guns, stahlhelms
- Medieval elements: plate armor, chainmail, sabers, maces, tabards, capes

BIOME UNIFORMS:
- Grasslands: olive drab wool, brown leather, brass fittings
- Tundra: white-grey fur-lined clothing, pale leather, silver metal
- Desert: sand tan linen, sun-bleached leather, bronze accents
- Badlands: charcoal grey, blackened leather, iron with rust
"""


def generate_ai_lore(entity, category):
    """Generate unique 3-paragraph lore using AI."""
    name = entity.get('name', 'Unknown')
    tier = entity.get('tier', 1)
    biome = entity.get('biome', 'grasslands')
    source_file = entity.get('sourceFile', '')
    species = entity.get('species', '')
    role = entity.get('role', 'medium')
    weapon_type = entity.get('weaponType', '')
    gender = entity.get('gender', 'male')
    body_type = entity.get('bodyType', 'medium')
    is_boss = category == 'bosses' or entity.get('isBoss', False)
    
    tier_names = {1: 'Tier 1 (low-level)', 2: 'Tier 2 (regular)', 3: 'Tier 3 (veteran)', 4: 'Tier 4 (elite)'}
    tier_text = tier_names.get(tier, f'Tier {tier}')
    
    if source_file == 'human':
        entity_type = f"{'Boss ' if is_boss else ''}Human Soldier"
        base_context = f"""
Character: {name}
Type: {entity_type}
Tier: {tier_text}
Biome: {biome}
Role: {role} (light=scout, medium=infantry, heavy=shock trooper, utility=support, special=commander)
Weapon: {weapon_type or 'standard weapons'}
Gender: {gender}
Body Type: {body_type}

Generate a 3-paragraph description of this soldier from HEAD TO TOE:
1. First paragraph: Their face covering/helmet, head protection, and overall presence
2. Second paragraph: Their torso - armor, uniform, coat/tabard, and how it shows their role and experience  
3. Third paragraph: Their lower body, boots, and their weapon/equipment they carry

Remember: Face must be FULLY COVERED. Use medieval+WWI fusion aesthetic. Be specific about materials, colors, and weathering."""
    
    elif source_file == 'saurian':
        entity_type = f"{'Boss ' if is_boss else ''}Saurian Warrior"
        base_context = f"""
Character: {name}
Type: {entity_type} (anthropomorphic {species})
Tier: {tier_text}
Biome: {biome}
Role: {role}
Weapon: {weapon_type or 'claws and military weapons'}
Species: {species}

Generate a 3-paragraph description of this anthropomorphic dinosaur warrior from HEAD TO TOE:
1. First paragraph: Their reptilian head, eyes, teeth, and any headgear (can have open face - they're reptiles)
2. Second paragraph: Their scaled torso, armor adapted for reptilian anatomy, uniform elements
3. Third paragraph: Their powerful legs, EXPOSED CLAWED DINOSAUR FEET (never boots), and weapons

Remember: Saurians walk upright, use weapons, wear armor, but their clawed feet are ALWAYS exposed. Medieval+WWI fusion."""
    
    elif source_file == 'dinosaur':
        entity_type = f"{'Alpha ' if is_boss else ''}War-Beast"
        base_context = f"""
Character: {name}
Type: {entity_type} ({species})
Tier: {tier_text}
Biome: {biome}

Generate a 3-paragraph description of this military war-beast dinosaur:
1. First paragraph: Their head, jaws, teeth, eyes - the predatory features and any head armor/barding
2. Second paragraph: Their body, the military barding/armor fitted to them, coloring matching biome
3. Third paragraph: Their legs, claws, tail, and overall presence as a killing machine

Remember: Dinosaurs are war-beasts fitted with military barding. Higher tiers = more ornate armor. They are NOT anthropomorphic."""
    
    elif source_file == 'herbivore':
        entity_type = f"{'Alpha ' if is_boss else ''}Wild Herbivore"
        base_context = f"""
Character: {name}
Type: {entity_type} ({species})
Tier: {tier_text}
Biome: {biome}

Generate a 3-paragraph description of this wild herbivore dinosaur:
1. First paragraph: Their head, eyes, any horns/plates/crests natural to the species
2. Second paragraph: Their massive body, natural hide coloring adapted to {biome} environment
3. Third paragraph: Their legs, stance, and overall presence - peaceful but dangerous if provoked

Remember: Herbivores are WILD and NATURAL. NO armor, NO equipment, NO military gear. Just natural dinosaur with biome-appropriate coloring."""
    
    elif category == 'npcs':
        entity_type = "Merchant NPC"
        base_context = f"""
Character: {name or 'Traveling Merchant'}
Type: {entity_type}
Biome: {biome}

Generate a 3-paragraph description of this merchant/trader NPC:
1. First paragraph: Their head covering (face covered for protection), trader's demeanor
2. Second paragraph: Their practical traveling clothes, trade pouches, pack
3. Third paragraph: Their sturdy boots, any self-defense weapons, and overall appearance

Remember: Face covered for protection. Practical, weathered traveling gear. Medieval+WWI fusion."""
    
    else:
        return f"{name} - entity description needed."
    
    prompt = f"""{STYLE_GUIDE}

{base_context}

Write the 3 paragraphs now. Be vivid and specific. Each paragraph should be 2-4 sentences."""

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"  API error: {e}")
        return None


def update_entity_lore_ai(category, force=False, limit=None):
    """Update entities with AI-generated lore."""
    cat_dir = os.path.join(ENTITIES_DIR, category)
    if not os.path.exists(cat_dir):
        print(f"Category not found: {category}")
        return 0
    
    count = 0
    for filename in sorted(os.listdir(cat_dir)):
        if not filename.endswith('.json'):
            continue
        
        if limit and count >= limit:
            print(f"  Reached limit of {limit}")
            break
        
        filepath = os.path.join(cat_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            entity = json.load(f)
        
        # Skip if has description and not forcing
        if entity.get('description') and not force:
            continue
        
        print(f"  Generating lore for {entity.get('id', filename)}...")
        lore = generate_ai_lore(entity, category)
        
        if lore:
            entity['description'] = lore
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(entity, f, indent=4)
            count += 1
            print(f"    ✓ Done")
            # Rate limiting
            time.sleep(1)
        else:
            print(f"    ✗ Failed")
    
    return count


if __name__ == '__main__':
    import sys
    
    force = '--force' in sys.argv
    limit = None
    
    for arg in sys.argv:
        if arg.startswith('--limit='):
            limit = int(arg.split('=')[1])
    
    if not os.environ.get('GOOGLE_API_KEY'):
        print("ERROR: GOOGLE_API_KEY environment variable not set")
        print("Set it with: $env:GOOGLE_API_KEY = 'your-api-key'")
        sys.exit(1)
    
    print("=== AI-Generated Lore Descriptions ===")
    if force:
        print("Mode: FORCE regenerate all")
    if limit:
        print(f"Limit: {limit} per category")
    print()
    
    total = 0
    for category in ['enemies', 'bosses', 'npcs']:
        print(f"\n=== {category.upper()} ===")
        total += update_entity_lore_ai(category, force=force, limit=limit)
    
    print(f"\n=== Done! Generated lore for {total} entities ===")
