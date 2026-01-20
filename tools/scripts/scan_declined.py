import json, os, glob

categories = ['enemies', 'items', 'resources', 'npcs', 'environment', 'props', 'ui', 'nodes', 'equipment']
missing = []
declined = []

for cat in categories:
    cat_dir = f'tools/{cat}'
    if not os.path.isdir(cat_dir):
        continue
    for jf in glob.glob(f'{cat_dir}/*.json'):
        if '_config' in jf or 'queue' in jf:
            continue
        with open(jf, encoding='utf-8') as f:
            try:
                data = json.load(f)
            except:
                continue
        for item in data:
            if not isinstance(item, dict):
                continue
            # Check main image
            img_path = item.get('files', {}).get('original') or item.get('files', {}).get('clean')
            status = item.get('status', 'pending')
            
            if status == 'declined':
                declined.append({'id': item['id'], 'cat': cat, 'file': os.path.basename(jf), 'prompt': item.get('sourceDescription',''), 'note': item.get('declineNote','')})
            elif img_path and not os.path.exists(img_path):
                missing.append({'id': item['id'], 'cat': cat, 'file': os.path.basename(jf), 'prompt': item.get('sourceDescription','')})

print('=== DECLINED ASSETS ===')
for d in declined:
    print(f"{d['cat']}/{d['file']}: {d['id']}")
    print(f"  prompt: {d['prompt'][:80]}...")
    print(f"  note: {d['note']}")
print(f'\nTotal declined: {len(declined)}')
print()
print('=== MISSING IMAGES ===')
for m in missing[:10]:
    print(f"{m['cat']}/{m['id']}")
print(f'Total missing: {len(missing)}')
