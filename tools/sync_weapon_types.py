"""
Scan all enemy files and set weaponType based on sourceDescription if missing.
Also sync sourceDescription to match the weaponType if they're out of sync.
"""
import json
import os
import re
import glob

base_dir = r"c:\Users\Anthony\.gemini\antigravity\scratch\jurassic-knights-valley"
enemies_dir = os.path.join(base_dir, "tools", "enemies")

# Weapon detection patterns - maps weapon keywords to weaponType
weapon_keywords = {
    'greatsword': 'greatsword',
    'sword': 'sword',
    'axe': 'axe',
    'mace': 'mace',
    'lance': 'lance',
    'halberd': 'halberd',
    'billhook': 'billhook',
    'trench club': 'trench_club',
    'bayonet': 'bayonet',
    'spear': 'spear',
    'pike': 'pike',
    'glaive': 'glaive',
    'warhammer': 'warhammer',
    'flail': 'flail',
    'rifle': 'rifle',
    'pistol': 'pistol',
    'submachine gun': 'submachine_gun',
    'machine gun': 'machine_gun',
    'rifle': 'rifle',
    'war horn': 'war_horn',
}

def detect_weapon_from_description(desc):
    """Detect weapon type from sourceDescription."""
    if not desc:
        return None
    desc_lower = desc.lower()
    
    # Check longer phrases first to avoid partial matches
    for keyword, weapon_type in sorted(weapon_keywords.items(), key=lambda x: -len(x[0])):
        if keyword in desc_lower:
            return weapon_type
    return None

def sync_description_to_weapon(desc, weapon_type):
    """Update description to match the weapon type."""
    if not desc or not weapon_type:
        return desc
    
    weapon_display = weapon_type.replace('_', ' ')
    weapons = list(weapon_keywords.keys())
    weapon_pattern = '|'.join(re.escape(w) for w in sorted(weapons, key=len, reverse=True))
    
    # Pattern 1: "wielding a/an/dual WEAPON"
    pattern1 = rf'(wielding (?:a |an |dual )?)({weapon_pattern})'
    if re.search(pattern1, desc, re.IGNORECASE):
        return re.sub(pattern1, rf'\1{weapon_display}', desc, count=1, flags=re.IGNORECASE)
    
    # Pattern 2: ", WEAPON" at end or ", WEAPON,"
    pattern2 = rf',\s*({weapon_pattern})(\s*,|\s*$)'
    if re.search(pattern2, desc, re.IGNORECASE):
        return re.sub(pattern2, f', {weapon_display}\\2', desc, count=1, flags=re.IGNORECASE)
    
    # Pattern 3: standalone weapon word
    for w in sorted(weapons, key=len, reverse=True):
        if w.lower() in desc.lower():
            return re.sub(rf'\b{re.escape(w)}\b', weapon_display, desc, count=1, flags=re.IGNORECASE)
    
    return desc

# Process all enemy JSON files
updates = []
for json_file in glob.glob(os.path.join(enemies_dir, "*.json")):
    if "_config" in json_file or "queue" in json_file:
        continue
    
    filename = os.path.basename(json_file)
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    modified = False
    for item in data:
        item_id = item.get('id', 'unknown')
        desc = item.get('sourceDescription', '')
        current_weapon = item.get('weaponType')
        attack_type = item.get('stats', {}).get('attackType', 'melee')
        
        # Skip herbivores (no weapons)
        if item.get('enemyType') == 'herbivore':
            continue
        
        # Detect weapon from description
        detected_weapon = detect_weapon_from_description(desc)
        
        # Case 1: No weaponType set - set it from description
        if not current_weapon and detected_weapon:
            item['weaponType'] = detected_weapon
            updates.append(f"[SET] {filename}/{item_id}: weaponType = {detected_weapon}")
            modified = True
        
        # Case 2: No weaponType and no weapon in description - set defaults based on attackType
        elif not current_weapon and not detected_weapon and attack_type:
            default = 'sword' if attack_type == 'melee' else 'rifle'
            item['weaponType'] = default
            updates.append(f"[DEFAULT] {filename}/{item_id}: weaponType = {default} (no weapon in desc)")
            modified = True
        
        # Case 3: weaponType set but description doesn't match - sync description
        elif current_weapon:
            synced_desc = sync_description_to_weapon(desc, current_weapon)
            if synced_desc != desc:
                item['sourceDescription'] = synced_desc
                updates.append(f"[SYNC] {filename}/{item_id}: desc updated to match {current_weapon}")
                modified = True
    
    if modified:
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)

print("=== WEAPON TYPE UPDATES ===")
for u in updates:
    print(u)
print(f"\nTotal updates: {len(updates)}")
