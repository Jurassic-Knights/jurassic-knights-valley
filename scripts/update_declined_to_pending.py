import json
import os
import glob

# Environment files
for jf in glob.glob('tools/environment/*.json'):
    if '_config' in jf:
        continue
    modified = False
    with open(jf, encoding='utf-8') as f:
        try:
            data = json.load(f)
        except:
            continue
    for item in data:
        if isinstance(item, dict) and item.get('status') == 'declined':
            item['status'] = 'pending'
            if 'declineNote' in item:
                del item['declineNote']
            modified = True
            print(f"Updated: {item.get('id')}")
    if modified:
        with open(jf, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)

# Node files
for jf in glob.glob('tools/nodes/*.json'):
    if '_config' in jf:
        continue
    modified = False
    with open(jf, encoding='utf-8') as f:
        try:
            data = json.load(f)
        except:
            continue
    for item in data:
        if isinstance(item, dict) and item.get('status') == 'declined':
            item['status'] = 'pending'
            if 'declineNote' in item:
                del item['declineNote']
            modified = True
            print(f"Updated: {item.get('id')}")
    if modified:
        with open(jf, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)

print('Done updating statuses to pending')
