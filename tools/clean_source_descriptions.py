import json
import os
import re
import glob

# Patterns to REMOVE from sourceDescriptions (boilerplate)
REMOVE_PATTERNS = [
    r'full body sprite of (?:a |an )?',
    r'sprite of (?:a |an )?',
    r'icon of (?:a |an )?',
    r'game (?:creature|character|item|ui|world|equipment) asset,?\s*',
    r'stoneshard style,?\s*',
    r'high fidelity pixel art,?\s*',
    r'high-fidelity pixel art,?\s*',
    r'top-down RPG,?\s*',
    r'side profile,?\s*',
    r'isolated on white background,?\s*',
    r'no text,?\s*',
    r'no letters,?\s*',
    r'no watermark,?\s*',
    r'no particles,?\s*',
    r'no VFX,?\s*',
    r'no smoke,?\s*',
    r'no fire,?\s*',
    r'match the isometric perspective of the reference image,?\s*',
    r'isometric perspective,?\s*',
    r'rusty, gritty, weathered,?\s*',
    r'war-beast appearance,?\s*',
    r'heavy plating,?\s*',
    r'natural appearance,?\s*',
    r'no armor, no gear,?\s*',
    # Pose patterns to remove
    r'(?:aggressive|defensive|neutral|alert|grazing|charging|standing|attacking|fleeing|huddled)\s*(?:stance|pose|posture),?\s*',
    r'(?:with lowered head|reaching upward|headbutting|earthquake footsteps impression),?\s*',
]

# Files to process
FILE_PATTERNS = [
    'tools/enemies/*.json',
    'tools/items/*.json',
    'tools/resources/*.json',
    'tools/equipment/*.json',
    'tools/nodes/*.json',
    'tools/npcs/*.json',
    'tools/ui/*.json',
    'tools/props/*.json',
    'tools/environment/*.json',
]

def clean_source_description(desc):
    if not desc:
        return desc
    
    cleaned = desc
    for pattern in REMOVE_PATTERNS:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
    
    # Clean up multiple commas/spaces
    cleaned = re.sub(r',\s*,', ',', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned)
    cleaned = re.sub(r'^[\s,]+', '', cleaned)
    cleaned = re.sub(r'[\s,]+$', '', cleaned)
    
    return cleaned.strip()

total_updated = 0

for pattern in FILE_PATTERNS:
    for filepath in glob.glob(pattern):
        if '_config' in filepath or 'queue' in filepath:
            continue
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"Error reading {filepath}: {e}")
            continue
        
        if not isinstance(data, list):
            continue
        
        modified = False
        for item in data:
            if 'sourceDescription' in item and item['sourceDescription']:
                old = item['sourceDescription']
                new = clean_source_description(old)
                if old != new:
                    item['sourceDescription'] = new
                    modified = True
                    total_updated += 1
            
            # Also clean consumedSourceDescription for nodes
            if 'consumedSourceDescription' in item and item['consumedSourceDescription']:
                old = item['consumedSourceDescription']
                new = clean_source_description(old)
                if old != new:
                    item['consumedSourceDescription'] = new
                    modified = True
                    total_updated += 1
        
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4)
            print(f"Updated: {filepath}")

print(f"\nTotal sourceDescriptions cleaned: {total_updated}")
