import os
import json
import re

# 1. Get all SFX IDs from SFX_*.js files
existing_sfx = set()
audio_dir = 'src/audio'
for f in os.listdir(audio_dir):
    if f.startswith('SFX_') and f.endswith('.js'):
        with open(os.path.join(audio_dir, f), 'r') as file:
            content = file.read()
            # Find all 'sfx_xxx' patterns that are function keys
            matches = re.findall(r"'(sfx_[a-z0-9_]+)'\s*:\s*function", content)
            existing_sfx.update(matches)

print(f'Existing SFX count: {len(existing_sfx)}')

# 2. Get all SFX IDs referenced in entity JSONs
referenced_sfx = {}
missing_sfx = []
entities_without_sfx = []

for category in ['enemies', 'bosses', 'nodes', 'resources', 'items', 'equipment', 'npcs', 'environment']:
    cat_dir = f'src/entities/{category}'
    if os.path.exists(cat_dir):
        for f in os.listdir(cat_dir):
            if f.endswith('.json'):
                with open(os.path.join(cat_dir, f), 'r') as file:
                    try:
                        data = json.load(file)
                        sfx = data.get('sfx', {})
                        if sfx:
                            for sfx_type, sfx_id in sfx.items():
                                if isinstance(sfx_id, str) and sfx_id not in existing_sfx:
                                    missing_sfx.append((category, data.get('id', f), sfx_type, sfx_id))
                        else:
                            # Entity has no SFX at all
                            entities_without_sfx.append((category, data.get('id', f)))
                    except:
                        pass

print(f'\nMissing SFX (referenced but not defined): {len(missing_sfx)}')
for cat, eid, stype, sid in missing_sfx[:40]:
    print(f'  [{cat}] {eid}.{stype} -> {sid}')
if len(missing_sfx) > 40:
    print(f'  ... and {len(missing_sfx) - 40} more')

print(f'\n\nEntities without ANY SFX: {len(entities_without_sfx)}')
for cat, eid in entities_without_sfx:
    print(f'  [{cat}] {eid}')
