import json
import os

# Check all entity JSONs for files.original paths that don't exist
for folder in ['enemies', 'bosses', 'ui']:
    entity_dir = f'src/entities/{folder}'
    if not os.path.exists(entity_dir):
        continue
    for f in os.listdir(entity_dir):
        if f.endswith('.json'):
            path = os.path.join(entity_dir, f)
            try:
                with open(path, 'r', encoding='utf-8-sig') as file:
                    data = json.load(file)
                if 'files' in data and 'original' in data['files']:
                    img_path = 'assets/' + data['files']['original']
                    if not os.path.exists(img_path):
                        print(f"MISSING: {data['id']} -> {img_path}")
                else:
                    print(f"NO PATH: {data.get('id', f)} has no files.original")
            except Exception as e:
                print(f"ERROR: {f} - {e}")
