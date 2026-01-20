"""
Migrate asset metadata from tools/enemies/*.json to src/assets/registry/enemies/

Creates one JSON file per entity with asset-only metadata:
- id, name, category
- status, sourceDescription, declineNote
- files (original, clean)
- generatedPrompt, lastUpdated
"""
import json
import os
import glob
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOLS_ENEMIES_DIR = os.path.join(BASE_DIR, 'tools', 'enemies')
REGISTRY_DIR = os.path.join(BASE_DIR, 'src', 'assets', 'registry', 'enemies')

def migrate_enemies():
    """Migrate all enemies from tools/ to registry"""
    os.makedirs(REGISTRY_DIR, exist_ok=True)
    
    migrated = 0
    
    # Load all enemies from tools/enemies/*.json
    for jf in glob.glob(os.path.join(TOOLS_ENEMIES_DIR, '*.json')):
        with open(jf, encoding='utf-8') as f:
            try:
                data = json.load(f)
            except:
                continue
        
        if not isinstance(data, list):
            continue
        
        source_file = os.path.basename(jf).replace('.json', '')
        
        for item in data:
            entity_id = f"enemy_{item['id']}"
            
            registry_entry = {
                "id": entity_id,
                "name": item.get('name', ''),
                "category": "enemies",
                "sourceFile": source_file,
                "status": item.get('status', 'pending'),
                "sourceDescription": item.get('sourceDescription', ''),
                "declineNote": item.get('declineNote'),
                "files": item.get('files', {}),
                "bodyType": item.get('bodyType'),
                "gender": item.get('gender'),
                "lastUpdated": datetime.now().isoformat()
            }
            
            # Remove None values
            registry_entry = {k: v for k, v in registry_entry.items() if v is not None}
            
            # Write to registry
            output_file = os.path.join(REGISTRY_DIR, f"{entity_id}.json")
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(registry_entry, f, indent=2)
            
            migrated += 1
            print(f"Migrated: {entity_id}")
    
    print(f"\nTotal migrated: {migrated}")

if __name__ == "__main__":
    migrate_enemies()
