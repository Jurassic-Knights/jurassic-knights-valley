#!/usr/bin/env python3
"""
Migrate equipment stats from string format to structured object format.
Example: "5 Dmg, 3.0 Rate, +Stagger" → {damage: 5, attackRate: 3.0, stagger: true}
"""
import os
import json
import re

EQUIPMENT_DIR = 'src/entities/equipment'

# Mapping patterns to stat keys
STAT_PATTERNS = [
    # Numeric stats: "5 Dmg" or "+5 Damage"
    (r'([+-]?\d+(?:\.\d+)?)\s*Dmg', 'damage'),
    (r'([+-]?\d+(?:\.\d+)?)\s*Damage', 'damage'),
    (r'([+-]?\d+(?:\.\d+)?)\s*Rate', 'attackRate'),
    (r'([+-]?\d+(?:\.\d+)?)\s*Armor', 'armor'),
    (r'([+-]?\d+(?:\.\d+)?)\s*Block', 'block'),
    (r'([+-]?\d+(?:\.\d+)?)\s*Mining Power', 'miningPower'),
    (r'([+-]?\d+(?:\.\d+)?)\s*Speed', 'speed'),
    (r'([+-]?\d+(?:\.\d+)?%?)\s*Crit', 'critChance'),
    (r'([+-]?\d+(?:\.\d+)?%?)\s*Range', 'range'),
    (r'([+-]?\d+(?:\.\d+)?%?)\s*Attack Speed', 'attackSpeed'),
    (r'([+-]?\d+(?:\.\d+)?%?)\s*Reload Speed', 'reloadSpeed'),
    
    # Resistances (numeric)
    (r'([+-]?\d+(?:\.\d+)?%?)\s*Cold Resist', 'coldResist'),
    (r'([+-]?\d+(?:\.\d+)?%?)\s*Heat Resist', 'heatResist'),
    (r'([+-]?\d+(?:\.\d+)?%?)\s*Poison Resist', 'poisonResist'),
]

# Boolean patterns (presence = true)
BOOL_PATTERNS = [
    (r'\+?Cold Resist(?![\d%])', 'coldResist'),  # Match if no number
    (r'\+?Heat Resist(?![\d%])', 'heatResist'),
    (r'\+?Poison Resist(?![\d%])', 'poisonResist'),
    (r'\+?Stagger', 'stagger'),
    (r'Stun chance', 'stagger'),
    (r'Bleed', 'bleed'),
    (r'Causes Bleed', 'bleed'),
    (r'Armor [Pp]enetration', 'armorPierce'),
    (r'Armor Pierce', 'armorPierce'),
    (r'\+?Pierce', 'pierce'),
    (r'Piercing', 'pierce'),
    (r'\+?Spread', 'spread'),
    (r'Thorns', 'thorns'),
    (r'Double Strike', 'doubleStrike'),
    (r'Execute bonus', 'executeBonus'),
    (r'Authority', 'authority'),
]


def parse_stats_string(stats_str):
    """Parse a stats string into a structured object"""
    if not stats_str or not isinstance(stats_str, str):
        return stats_str  # Already an object or empty
    
    result = {}
    
    # Extract numeric stats
    for pattern, key in STAT_PATTERNS:
        match = re.search(pattern, stats_str, re.IGNORECASE)
        if match:
            value = match.group(1).replace('%', '')
            # Handle negative values
            if value.startswith('+'):
                value = value[1:]
            result[key] = float(value) if '.' in value else int(value)
    
    # Check boolean patterns (only if not already set numerically)
    for pattern, key in BOOL_PATTERNS:
        if key not in result:
            if re.search(pattern, stats_str, re.IGNORECASE):
                result[key] = True
    
    return result if result else {"raw": stats_str}


def migrate_equipment_file(filepath):
    """Migrate a single equipment file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if 'stats' in data and isinstance(data['stats'], str):
        original = data['stats']
        data['stats'] = parse_stats_string(original)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        
        return True, original, data['stats']
    return False, None, None


def main():
    print("=== Equipment Stats Migration ===\n")
    
    migrated = 0
    for filename in sorted(os.listdir(EQUIPMENT_DIR)):
        if not filename.endswith('.json'):
            continue
        
        filepath = os.path.join(EQUIPMENT_DIR, filename)
        changed, original, new_stats = migrate_equipment_file(filepath)
        
        if changed:
            migrated += 1
            print(f"[OK] {filename}")
            print(f"  FROM: {original}")
            print(f"  TO:   {new_stats}\n")
    
    print(f"=== Migrated {migrated} files ===")


if __name__ == '__main__':
    main()
