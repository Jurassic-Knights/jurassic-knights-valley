"""
Sync sourceDescriptions from tools/ JSON files to src/entities/ JSON files.
Source of truth: tools/{category}/*.json
Target: src/entities/{category}/*.json
"""
import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOLS_DIR = os.path.join(BASE_DIR, 'tools')
ENTITIES_DIR = os.path.join(BASE_DIR, 'src', 'entities')

# Mapping of entity category to tools source files
SOURCE_MAPPINGS = {
    'nodes': [os.path.join(TOOLS_DIR, 'nodes', 'nodes.json')],
    'items': [
        os.path.join(TOOLS_DIR, 'items', 'bone.json'),
        os.path.join(TOOLS_DIR, 'items', 'leather.json'),
        os.path.join(TOOLS_DIR, 'items', 'mechanical.json'),
        os.path.join(TOOLS_DIR, 'items', 'metal.json'),
        os.path.join(TOOLS_DIR, 'items', 'wood.json'),
    ],
    'resources': [
        os.path.join(TOOLS_DIR, 'resources', 'food.json'),
        os.path.join(TOOLS_DIR, 'resources', 'minerals.json'),
        os.path.join(TOOLS_DIR, 'resources', 'salvage.json'),
        os.path.join(TOOLS_DIR, 'resources', 'scraps.json'),
    ],
}


def load_source_descriptions():
    """Load all sourceDescriptions from tools/ JSON files into a dictionary keyed by ID."""
    descriptions = {}
    
    for category, source_files in SOURCE_MAPPINGS.items():
        for source_file in source_files:
            if not os.path.exists(source_file):
                print(f"Warning: Source file not found: {source_file}")
                continue
            
            try:
                with open(source_file, 'r', encoding='utf-8-sig') as f:
                    items = json.load(f)
                
                for item in items:
                    item_id = item.get('id')
                    if item_id and item.get('sourceDescription'):
                        descriptions[item_id] = item['sourceDescription']
                        
            except Exception as e:
                print(f"Error reading {source_file}: {e}")
    
    return descriptions


def sync_to_entities(descriptions):
    """Sync sourceDescriptions to entity JSON files."""
    updated_count = 0
    
    for category in SOURCE_MAPPINGS.keys():
        entity_dir = os.path.join(ENTITIES_DIR, category)
        if not os.path.exists(entity_dir):
            print(f"Warning: Entity directory not found: {entity_dir}")
            continue
        
        for filename in os.listdir(entity_dir):
            if not filename.endswith('.json'):
                continue
            
            filepath = os.path.join(entity_dir, filename)
            try:
                with open(filepath, 'r', encoding='utf-8-sig') as f:
                    entity = json.load(f)
                
                entity_id = entity.get('id')
                if entity_id in descriptions:
                    old_desc = entity.get('sourceDescription', '')
                    new_desc = descriptions[entity_id]
                    
                    if old_desc != new_desc:
                        entity['sourceDescription'] = new_desc
                        with open(filepath, 'w', encoding='utf-8') as f:
                            json.dump(entity, f, indent=4)
                            f.write('\n')
                        print(f"Updated: {entity_id}")
                        updated_count += 1
                else:
                    if not entity.get('sourceDescription'):
                        print(f"No source description found for: {entity_id}")
                        
            except Exception as e:
                print(f"Error processing {filepath}: {e}")
    
    return updated_count


if __name__ == '__main__':
    print("Loading sourceDescriptions from tools/ JSON files...")
    descriptions = load_source_descriptions()
    print(f"Found {len(descriptions)} sourceDescriptions\n")
    
    print("Syncing to entity JSON files...")
    updated = sync_to_entities(descriptions)
    print(f"\nDone! Updated {updated} entity files.")
