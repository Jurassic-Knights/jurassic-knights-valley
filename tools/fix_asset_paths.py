"""
Fix all entity JSONs that have 'assets/' prefix in files.original paths.
Removes the prefix so paths are relative to assets/ directory.
"""
import json
import os

ENTITIES_DIR = "src/entities"

def fix_category(category):
    """Fix paths in a single category"""
    fixed = 0
    category_dir = os.path.join(ENTITIES_DIR, category)
    
    if not os.path.exists(category_dir):
        return 0
    
    for filename in os.listdir(category_dir):
        if not filename.endswith('.json'):
            continue
        
        filepath = os.path.join(category_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8-sig') as f:
                data = json.load(f)
        except Exception as e:
            print(f"ERROR reading {filename}: {e}")
            continue
        
        files = data.get('files', {})
        modified = False
        
        # Fix original path
        if files.get('original', '').startswith('assets/'):
            files['original'] = files['original'].replace('assets/', '', 1)
            modified = True
        
        # Fix clean path if exists
        if files.get('clean', '').startswith('assets/'):
            files['clean'] = files['clean'].replace('assets/', '', 1)
            modified = True
        
        # Fix consumed paths if exists
        if files.get('consumed_original', '').startswith('assets/'):
            files['consumed_original'] = files['consumed_original'].replace('assets/', '', 1)
            modified = True
        
        if files.get('consumed_clean', '').startswith('assets/'):
            files['consumed_clean'] = files['consumed_clean'].replace('assets/', '', 1)
            modified = True
        
        if modified:
            data['files'] = files
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            fixed += 1
    
    return fixed

def main():
    categories = ['enemies', 'bosses', 'npcs', 'items', 'resources', 'nodes', 'equipment', 'environment', 'ui']
    
    total_fixed = 0
    for category in categories:
        fixed = fix_category(category)
        if fixed > 0:
            print(f"Fixed {fixed} files in {category}")
            total_fixed += fixed
    
    print(f"\nTotal fixed: {total_fixed}")

if __name__ == "__main__":
    main()
