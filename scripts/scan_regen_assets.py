"""Scan for declined and missing assets."""
import json
import os
import glob

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
        with open(jf) as f:
            try:
                data = json.load(f)
            except:
                continue
        for item in data:
            # Check main image
            img_path = item.get('files', {}).get('original') or item.get('files', {}).get('clean')
            status = item.get('status', 'pending')
            
            if status == 'declined':
                declined.append({
                    'id': item['id'], 
                    'cat': cat, 
                    'file': os.path.basename(jf), 
                    'prompt': item.get('sourceDescription', ''), 
                    'note': item.get('declineNote', '')
                })
            elif img_path and not os.path.exists(img_path):
                missing.append({
                    'id': item['id'], 
                    'cat': cat, 
                    'file': os.path.basename(jf), 
                    'prompt': item.get('sourceDescription', '')
                })
            
            # Check consumed image for nodes - ONLY if base is approved/clean
            base_approved = status in ['approved', 'clean']
            consumed_path = item.get('files', {}).get('consumed_original') or item.get('files', {}).get('consumed_clean')
            consumed_status = item.get('consumedStatus', status)
            if consumed_status == 'declined' and base_approved:
                declined.append({
                    'id': item['id'] + '_consumed', 
                    'cat': cat, 
                    'file': os.path.basename(jf), 
                    'prompt': item.get('consumedSourceDescription', ''), 
                    'note': item.get('consumedDeclineNote', ''),
                    'base_ref': item.get('files', {}).get('clean') or item.get('files', {}).get('original')
                })
            elif consumed_path and not os.path.exists(consumed_path) and base_approved:
                missing.append({
                    'id': item['id'] + '_consumed', 
                    'cat': cat, 
                    'file': os.path.basename(jf), 
                    'prompt': item.get('consumedSourceDescription', ''),
                    'base_ref': item.get('files', {}).get('clean') or item.get('files', {}).get('original')
                })

print('=== DECLINED ASSETS ===')
for d in declined:
    print(f"{d['cat']}/{d['file']}/{d['id']}: {d['note'] or 'no note'}")
print(f'Total declined: {len(declined)}')
print()
print('=== MISSING IMAGES ===')
for m in missing:
    print(f"{m['cat']}/{m['file']}/{m['id']}")
print(f'Total missing: {len(missing)}')
