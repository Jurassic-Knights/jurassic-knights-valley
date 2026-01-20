import json, os, glob

declined = []
for jf in glob.glob('tools/nodes/*.json'):
    if '_config' in jf:
        continue
    with open(jf, encoding='utf-8') as f:
        try:
            data = json.load(f)
        except:
            continue
    for item in data:
        if not isinstance(item, dict):
            continue
        status = item.get('status', 'pending')
        if status == 'declined':
            declined.append({
                'id': item['id'], 
                'file': os.path.basename(jf), 
                'desc': item.get('sourceDescription','')[:100],
                'note': item.get('declineNote','')
            })

for d in declined:
    print(f"{d['file']}: {d['id']}")
    print(f"  Desc: {d['desc']}")
    print(f"  Note: {d['note']}")
print(f'\nTotal: {len(declined)}')
