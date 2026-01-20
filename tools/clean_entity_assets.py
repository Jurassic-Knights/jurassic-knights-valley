"""
Remove asset metadata fields from src/entities/enemies/*.json
These fields now live in src/assets/registry/enemies/

Fields to remove:
- status
- sourceDescription
- declineNote
- files (keep it if no registry entry exists)
"""
import json
import os
import glob

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTITIES_DIR = os.path.join(BASE_DIR, 'src', 'entities', 'enemies')
REGISTRY_DIR = os.path.join(BASE_DIR, 'src', 'assets', 'registry', 'enemies')

ASSET_FIELDS = ['status', 'sourceDescription', 'declineNote']

def clean_entity_files():
    """Remove asset metadata from entity files"""
    cleaned = 0
    
    for filepath in glob.glob(os.path.join(ENTITIES_DIR, '*.json')):
        with open(filepath, 'r', encoding='utf-8') as f:
            entity = json.load(f)
        
        entity_id = entity.get('id')
        registry_path = os.path.join(REGISTRY_DIR, f"{entity_id}.json")
        
        # Only remove fields if registry entry exists
        if not os.path.exists(registry_path):
            print(f"Skipping {entity_id} - no registry entry")
            continue
        
        modified = False
        for field in ASSET_FIELDS:
            if field in entity:
                del entity[field]
                modified = True
        
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(entity, f, indent=2)
            print(f"Cleaned: {entity_id}")
            cleaned += 1
    
    print(f"\nTotal cleaned: {cleaned}")

if __name__ == "__main__":
    clean_entity_files()
