import json
import os
import glob

# Asset definition directories (NOT loot - that's drop data, not asset definitions)
tool_dirs = [
    'tools/enemies',
    'tools/environment', 
    'tools/equipment',
    'tools/items',
    'tools/nodes',
    'tools/npcs',
    'tools/props',
    'tools/resources',
    'tools/ui',
    # EXCLUDED: tools/loot - contains loot drop tables, not asset definitions
    # EXCLUDED: tools/vfx, tools/audio, tools/buildings - may have different structure
]

no_path_defined = []  # Approved/pending but no image path in files
missing_file = []     # Has path but file doesn't exist
declined = []

for tool_dir in tool_dirs:
    if not os.path.isdir(tool_dir):
        continue
    
    for jf in glob.glob(f'{tool_dir}/*.json'):
        # Skip config and queue files
        if '_config' in jf or 'queue' in jf:
            continue
        
        with open(jf, encoding='utf-8') as f:
            try:
                data = json.load(f)
            except:
                continue
        
        # Skip if not a list of items
        if not isinstance(data, list):
            continue
        
        for item in data:
            if not isinstance(item, dict):
                continue
            
            item_id = item.get('id', 'unknown')
            status = item.get('status', 'pending')
            files = item.get('files', {})
            
            # Get the primary image path  
            img_path = files.get('original') or files.get('clean')
            
            # Check for declined assets
            if status == 'declined':
                declined.append({
                    'id': item_id,
                    'dir': tool_dir,
                    'file': os.path.basename(jf),
                    'prompt': item.get('sourceDescription', ''),
                    'note': item.get('declineNote', '')
                })
            # Non-declined assets should have images
            elif status in ['approved', 'pending', 'clean']:
                # Case 1: No image path defined at all
                if not img_path:
                    no_path_defined.append({
                        'id': item_id,
                        'dir': tool_dir,
                        'file': os.path.basename(jf),
                        'status': status,
                        'prompt': item.get('sourceDescription', '')
                    })
                # Case 2: Path defined but file doesn't exist
                elif not os.path.exists(img_path):
                    missing_file.append({
                        'id': item_id,
                        'dir': tool_dir,
                        'file': os.path.basename(jf),
                        'status': status,
                        'path': img_path,
                        'prompt': item.get('sourceDescription', '')
                    })
            
            # ONLY check consumed images for nodes
            if 'nodes' in tool_dir:
                consumed_path = files.get('consumed_original') or files.get('consumed_clean')
                consumed_status = item.get('consumedStatus', 'pending')
                
                if consumed_status == 'declined':
                    declined.append({
                        'id': f"{item_id}_consumed",
                        'dir': tool_dir,
                        'file': os.path.basename(jf),
                        'prompt': item.get('consumedSourceDescription', ''),
                        'note': item.get('consumedDeclineNote', '')
                    })
                elif consumed_status in ['approved', 'pending', 'clean']:
                    if not consumed_path:
                        no_path_defined.append({
                            'id': f"{item_id}_consumed",
                            'dir': tool_dir,
                            'file': os.path.basename(jf),
                            'status': consumed_status,
                            'prompt': item.get('consumedSourceDescription', '')
                        })
                    elif not os.path.exists(consumed_path):
                        missing_file.append({
                            'id': f"{item_id}_consumed",
                            'dir': tool_dir,
                            'file': os.path.basename(jf),
                            'status': consumed_status,
                            'path': consumed_path,
                            'prompt': item.get('consumedSourceDescription', '')
                        })

print('=== DECLINED ASSETS (need regeneration) ===')
for d in declined:
    print(f"  {d['file']}/{d['id']}: {d['note'] or 'no note'}")
print(f'Total declined: {len(declined)}')
print()
print('=== NO IMAGE PATH DEFINED (approved/pending but files empty) ===')
for m in no_path_defined:
    print(f"  {m['file']}/{m['id']} [{m['status']}]")
print(f'Total with no path: {len(no_path_defined)}')
print()
print('=== MISSING FILES (path defined but file not found) ===')
for m in missing_file:
    print(f"  {m['file']}/{m['id']} [{m['status']}]: {m['path']}")
print(f'Total missing files: {len(missing_file)}')
print()
print(f'=== TOTAL NEEDING IMAGES: {len(declined) + len(no_path_defined) + len(missing_file)} ===')
