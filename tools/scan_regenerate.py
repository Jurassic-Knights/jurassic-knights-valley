"""
Scan for declined and missing assets.
Reads from src/assets/registry/, src/entities/, and tools/ categories.
"""
import json, os, glob

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGISTRY_DIR = os.path.join(BASE_DIR, 'src', 'assets', 'registry')
ENTITIES_DIR = os.path.join(BASE_DIR, 'src', 'entities')

missing = []
declined = []

def scan_entity_dir(entity_dir, category, registry_dir=None):
    """Scan an entity directory for declined or missing images"""
    if not os.path.isdir(entity_dir):
        return
    
    for jf in glob.glob(os.path.join(entity_dir, '*.json')):
        with open(jf, encoding='utf-8-sig') as f:
            try:
                item = json.load(f)
            except:
                continue
        
        item_id = item.get('id', os.path.basename(jf).replace('.json', ''))
        
        # Check registry for status override
        status = item.get('status', 'pending')
        decline_note = item.get('declineNote', '')
        if registry_dir:
            reg_file = os.path.join(registry_dir, f"{item_id}.json")
            if os.path.exists(reg_file):
                with open(reg_file, encoding='utf-8-sig') as rf:
                    try:
                        reg = json.load(rf)
                        status = reg.get('status', status)
                        decline_note = reg.get('declineNote', decline_note)
                    except:
                        pass
        
        img_path = item.get('files', {}).get('original') or item.get('files', {}).get('clean')
        
        if status == 'declined':
            declined.append({
                'id': item_id, 
                'cat': category, 
                'file': os.path.basename(jf), 
                'prompt': item.get('sourceDescription', ''), 
                'note': decline_note
            })
        elif not img_path:
            # No files field at all - treat as missing
            missing.append({
                'id': item_id, 
                'cat': category, 
                'file': os.path.basename(jf), 
                'prompt': item.get('sourceDescription', ''),
                'reason': 'no files field'
            })
        else:
            full_path = os.path.join(BASE_DIR, img_path)
            if not os.path.exists(full_path):
                missing.append({
                    'id': item_id, 
                    'cat': category, 
                    'file': os.path.basename(jf), 
                    'prompt': item.get('sourceDescription', ''),
                    'reason': 'file not found'
                })

# Scan src/entities/enemies/
scan_entity_dir(
    os.path.join(ENTITIES_DIR, 'enemies'), 
    'enemies',
    os.path.join(REGISTRY_DIR, 'enemies')
)

# Scan src/entities/bosses/
scan_entity_dir(
    os.path.join(ENTITIES_DIR, 'bosses'), 
    'bosses',
    os.path.join(REGISTRY_DIR, 'bosses')
)

# Scan src/entities/ui/
scan_entity_dir(
    os.path.join(ENTITIES_DIR, 'ui'), 
    'ui',
    os.path.join(REGISTRY_DIR, 'ui')
)


# Scan src/assets/registry/nodes/
nodes_dir = os.path.join(REGISTRY_DIR, 'nodes')
if os.path.isdir(nodes_dir):
    for jf in glob.glob(os.path.join(nodes_dir, '*.json')):
        with open(jf, encoding='utf-8-sig') as f:
            try:
                item = json.load(f)
            except:
                continue
        
        img_path = item.get('files', {}).get('original') or item.get('files', {}).get('clean')
        status = item.get('status', 'pending')
        
        if status == 'declined':
            declined.append({
                'id': item['id'], 
                'cat': 'nodes', 
                'file': os.path.basename(jf), 
                'prompt': item.get('sourceDescription', ''), 
                'note': item.get('declineNote', '')
            })
        elif img_path:
            full_path = os.path.join(BASE_DIR, img_path)
            if not os.path.exists(full_path):
                missing.append({
                    'id': item['id'], 
                    'cat': 'nodes', 
                    'file': os.path.basename(jf), 
                    'prompt': item.get('sourceDescription', '')
                })
        
        # Check consumed version
        base_approved = status in ['approved', 'clean']
        consumed_path = item.get('files', {}).get('consumed_original') or item.get('files', {}).get('consumed_clean')
        consumed_status = item.get('consumedStatus', status)
        
        if consumed_status == 'declined' and base_approved:
            declined.append({
                'id': item['id'] + '_consumed',
                'cat': 'nodes',
                'file': os.path.basename(jf),
                'prompt': item.get('consumedSourceDescription', ''),
                'note': item.get('consumedDeclineNote', ''),
                'base_ref': item.get('files', {}).get('clean') or item.get('files', {}).get('original')
            })
        elif consumed_path and base_approved:
            full_consumed_path = os.path.join(BASE_DIR, consumed_path)
            if not os.path.exists(full_consumed_path):
                missing.append({
                    'id': item['id'] + '_consumed',
                    'cat': 'nodes',
                    'file': os.path.basename(jf),
                    'prompt': item.get('consumedSourceDescription', ''),
                    'base_ref': item.get('files', {}).get('clean') or item.get('files', {}).get('original')
                })

# Scan src/entities/equipment/ for weapon/armor/tool entities
# Status may be stored in registry (src/assets/registry/equipment/) rather than entity JSON
equipment_dir = os.path.join(ENTITIES_DIR, 'equipment')
registry_equipment_dir = os.path.join(REGISTRY_DIR, 'equipment')
if os.path.isdir(equipment_dir):
    for jf in glob.glob(os.path.join(equipment_dir, '*.json')):
        with open(jf, encoding='utf-8-sig') as f:
            try:
                item = json.load(f)
            except:
                continue
        
        item_id = item['id']
        img_path = item.get('files', {}).get('original') or item.get('files', {}).get('clean')
        
        # Check registry for status override (dashboard writes to registry)
        registry_file = os.path.join(registry_equipment_dir, f"{item_id}.json")
        if os.path.exists(registry_file):
            with open(registry_file, encoding='utf-8-sig') as rf:
                try:
                    reg = json.load(rf)
                    status = reg.get('status', item.get('status', 'pending'))
                    decline_note = reg.get('declineNote', item.get('declineNote', ''))
                except:
                    status = item.get('status', 'pending')
                    decline_note = item.get('declineNote', '')
        else:
            status = item.get('status', 'pending')
            decline_note = item.get('declineNote', '')
        
        if status == 'declined':
            declined.append({
                'id': item_id, 
                'cat': 'equipment', 
                'file': os.path.basename(jf), 
                'prompt': item.get('sourceDescription', ''), 
                'note': decline_note
            })
        elif img_path:
            full_path = os.path.join(BASE_DIR, img_path)
            if not os.path.exists(full_path):
                missing.append({
                    'id': item_id, 
                    'cat': 'equipment', 
                    'file': os.path.basename(jf), 
                    'prompt': item.get('sourceDescription', '')
                })

# Also scan tools/ categories that don't have src/entities equivalents
tools_categories = ['items', 'resources', 'npcs', 'environment', 'props', 'ui']
for cat in tools_categories:
    cat_dir = os.path.join(BASE_DIR, 'tools', cat)
    if not os.path.isdir(cat_dir):
        continue
    for jf in glob.glob(os.path.join(cat_dir, '*.json')):
        if '_config' in jf or 'queue' in jf:
            continue
        with open(jf, encoding='utf-8-sig') as f:
            try:
                data = json.load(f)
            except:
                continue
        
        if not isinstance(data, list):
            continue
            
        for item in data:
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
            elif img_path:
                full_path = os.path.join(BASE_DIR, img_path)
                if not os.path.exists(full_path):
                    missing.append({
                        'id': item['id'],
                        'cat': cat,
                        'file': os.path.basename(jf),
                        'prompt': item.get('sourceDescription', '')
                    })

print('=== DECLINED ASSETS ===')
for d in declined:
    print(f"{d['cat']}/{d['id']}: {d.get('note') or 'no note'}")
print(f'Total declined: {len(declined)}')
print()
print('=== MISSING IMAGES ===')
for m in missing:
    print(f"{m['cat']}/{m['id']}")
print(f'Total missing: {len(missing)}')

