import json, os, glob

categories = ['enemies']
missing = []
declined = []

for cat in categories:
    cat_dir = f'tools/{cat}'
    if not os.path.isdir(cat_dir):
        continue
    for jf in glob.glob(f'{cat_dir}/*.json'):
        if '_config' in jf or 'queue' in jf:
            continue
        with open(jf) as f:
            try:
                data = json.load(f)
            except:
                continue
        for item in data:
            img_path = item.get('files', {}).get('original') or item.get('files', {}).get('clean')
            status = item.get('status', 'pending')
            
            if status == 'declined':
                declined.append({
                    'id': item['id'], 
                    'name': item.get('name',''), 
                    'cat': cat, 
                    'file': os.path.basename(jf), 
                    'sourceDescription': item.get('sourceDescription',''),
                    'declineNote': item.get('declineNote',''),
                    'weaponType': item.get('weaponType','')
                })
            elif status in ['pending', 'approved'] and (not img_path or not os.path.exists(img_path)):
                missing.append({
                    'id': item['id'], 
                    'name': item.get('name',''), 
                    'cat': cat, 
                    'file': os.path.basename(jf), 
                    'sourceDescription': item.get('sourceDescription','')
                })

print('=== DECLINED ASSETS ===')
print('IMPORTANT: Use sourceDescription for prompt, NOT the name!')
print()
for d in declined:
    print(f"--- {d['file']}/{d['id']} ({d['name']}) ---")
    print(f"  declineNote: {d['declineNote'] or '(none)'}")
    print(f"  weaponType: {d['weaponType'] or '(not set)'}")
    print(f"  sourceDescription: {d['sourceDescription']}")
    print()
print(f'Total declined: {len(declined)}')
print()
print('=== MISSING IMAGES ===')
for m in missing:
    print(f"{m['file']}/{m['id']} ({m['name']})")
    print(f"  sourceDescription: {m['sourceDescription']}")
print(f'Total missing: {len(missing)}')

