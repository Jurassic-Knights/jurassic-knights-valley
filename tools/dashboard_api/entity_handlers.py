"""
Dashboard API - Entity Handlers
Sync entity data to individual JSON files
"""
import os
import json
from .utils import BASE_DIR, TOOLS_DIR


def sync_all_entities():
    """Sync ALL dashboard entities to individual JSON files"""
    synced_count = 0
    errors = []
    
    # All categories to sync
    categories = ['enemies', 'equipment', 'items', 'resources', 'nodes', 'environment', 'npcs']
    
    for category in categories:
        cat_dir = os.path.join(TOOLS_DIR, category)
        if not os.path.exists(cat_dir):
            continue
        
        for filename in os.listdir(cat_dir):
            # Skip non-JSON and config files
            if not filename.endswith('.json'):
                continue
            if filename.startswith('_') or filename == 'asset_queue.json':
                continue
            
            filepath = os.path.join(cat_dir, filename)
            try:
                with open(filepath, 'r', encoding='utf-8-sig') as f:
                    data = json.load(f)
                
                # Skip if not a list of entities
                if not isinstance(data, list):
                    continue
                
                for item in data:
                    # Skip if not a dict
                    if not isinstance(item, dict):
                        continue
                        
                    entity_id = item.get('id')
                    if not entity_id:
                        continue
                    
                    try:
                        sync_entity_to_json(item, filename, category)
                        synced_count += 1
                    except Exception as e:
                        errors.append(f"{entity_id}: {str(e)}")
                        
            except Exception as e:
                errors.append(f"{filename}: {str(e)}")
                continue
    
    result = {"success": True, "synced": synced_count}
    if errors:
        result["errors"] = errors[:10]  # Limit to first 10 errors
    return result


def sync_entity_to_json(entity, filename, category='enemies'):
    """Sync a single entity to its individual JSON file"""
    entity_id = entity.get('id')
    if not entity_id:
        return
    
    # Determine subfolder based on category
    # Map category to entity subfolder
    category_to_folder = {
        'enemies': 'enemies',  # or 'bosses' for tier >= 4
        'equipment': 'equipment',
        'items': 'items',
        'resources': 'resources',
        'nodes': 'nodes',
        'environment': 'environment',
        'npcs': 'npcs'
    }
    
    # For enemies, keep them in enemies folder (bosses are separate category)
    if category == 'enemies':
        tier = _extract_tier(entity_id)
        subfolder = 'enemies'  # Enemies always go to enemies folder
        # Add enemy_ prefix for enemies
        full_id = f"enemy_{entity_id}" if not entity_id.startswith('enemy_') else entity_id
        is_boss = False
    else:
        tier = _extract_tier(entity_id)
        is_boss = False
        subfolder = category_to_folder.get(category, category)
        full_id = entity_id  # Keep original ID for non-enemies
    
    # Entity JSON path
    entity_dir = os.path.join(BASE_DIR, 'src', 'entities', subfolder)
    os.makedirs(entity_dir, exist_ok=True)
    
    entity_path = os.path.join(entity_dir, f'{full_id}.json')
    
    # Build entity JSON structure
    entity_json = _build_entity_json(entity, filename, full_id, tier, is_boss, category)
    
    # Write entity JSON
    with open(entity_path, 'w', encoding='utf-8-sig') as f:
        json.dump(entity_json, f, indent=2)
    
    # Update manifest
    update_entity_manifest(full_id, subfolder)
    
    print(f"[EntitySync] Wrote {entity_path}")


def _extract_tier(entity_id):
    """Extract tier number from entity ID like human_t1_01 -> 1"""
    if '_t' in entity_id:
        try:
            tier_part = entity_id.split('_t')[1]
            return int(tier_part[0])
        except (IndexError, ValueError):
            pass
    return 1


def _build_entity_json(entity, filename, full_id, tier, is_boss, category='enemies'):
    """Build the entity JSON structure from dashboard data"""
    # stats can be a string (equipment) or dict (enemies) - only use dict methods if it's a dict
    stats_raw = entity.get('stats', {})
    stats = stats_raw if isinstance(stats_raw, dict) else {}
    
    # Base structure for all entities
    entity_json = {
        'id': full_id,
        'name': entity.get('name', full_id),
        'sourceCategory': category,
        'sourceFile': filename.replace('.json', ''),
        'sprite': entity.get('id', full_id),  # Use original ID for sprite lookup
        'status': entity.get('status', 'pending'),
    }
    
    # Copy files info if present
    if 'files' in entity:
        entity_json['files'] = entity['files']
    
    # Category-specific data
    if category == 'enemies':
        entity_json['tier'] = tier
        entity_json['biome'] = entity.get('biome', 'grasslands')
        
        # Stats
        entity_json['stats'] = {
            'health': stats.get('health', 50),
            'damage': stats.get('damage', 10),
            'speed': stats.get('speed', 80),
            'defense': stats.get('defense', 0)
        }
        
        # Combat
        entity_json['combat'] = {
            'attackRange': stats.get('attackRange', 100),
            'attackRate': stats.get('attackRate', 1.0),
            'aggroRange': stats.get('aggroRange', 200),
            'packAggro': stats.get('packAggro', False),
            'attackType': stats.get('attackType', 'melee')
        }
        
        # SFX - extract IDs from nested structure
        if 'sfx' in entity and isinstance(entity['sfx'], dict):
            entity_json['sfx'] = {}
            for key in ['spawn', 'death', 'hurt', 'aggro', 'attack']:
                sfx_entry = entity['sfx'].get(key)
                if isinstance(sfx_entry, dict):
                    entity_json['sfx'][key] = sfx_entry.get('id', f'sfx_{key}_{full_id}')
                elif isinstance(sfx_entry, str):
                    entity_json['sfx'][key] = sfx_entry
        
        # Spawning
        entity_json['spawning'] = {
            'biomes': [entity.get('biome', 'grasslands')],
            'groupSize': [1, 2],
            'weight': 50,
            'respawnTime': 30
        }
        
        # Loot from drops
        if 'drops' in entity and isinstance(entity['drops'], list):
            loot = []
            for drop in entity['drops']:
                if isinstance(drop, dict):
                    loot.append({
                        'item': drop.get('id', ''),
                        'chance': drop.get('chance', 100) / 100.0,
                        'amount': [drop.get('min', 1), drop.get('max', 1)]
                    })
            entity_json['loot'] = loot
        
        # XP
        entity_json['xpReward'] = stats.get('xpReward', 10)
        
        # Boss-specific
        if is_boss:
            entity_json['isBoss'] = True
    
    elif category == 'equipment':
        # Equipment: stats, slot, etc.
        entity_json['type'] = entity.get('type', 'weapon')
        entity_json['slot'] = entity.get('slot', 'weapon')
        # Equipment stats can be string or dict - preserve as-is
        if stats_raw:
            entity_json['stats'] = stats_raw
        if 'recipe' in entity:
            entity_json['recipe'] = entity['recipe']
    
    elif category == 'items':
        # Items: type, stackable, etc.
        entity_json['type'] = entity.get('type', 'consumable')
        entity_json['stackable'] = entity.get('stackable', True)
        if stats:
            entity_json['stats'] = stats
        if 'recipe' in entity:
            entity_json['recipe'] = entity['recipe']
    
    elif category == 'resources':
        # Resources: tier, stackable
        entity_json['tier'] = tier
        entity_json['stackable'] = entity.get('stackable', True)
        entity_json['type'] = entity.get('type', 'material')
    
    elif category == 'nodes':
        # Nodes: harvest data, health, drops
        entity_json['type'] = entity.get('type', 'ore')
        entity_json['biome'] = entity.get('biome', 'grasslands')
        if stats:
            entity_json['stats'] = stats
        if 'drops' in entity:
            entity_json['drops'] = entity['drops']
    
    elif category == 'environment':
        # Environment: biome, type
        entity_json['type'] = entity.get('type', 'prop')
        entity_json['biome'] = entity.get('biome', 'grasslands')
    
    elif category == 'npcs':
        # NPCs: type, dialogue, shop
        entity_json['type'] = entity.get('type', 'merchant')
        entity_json['biome'] = entity.get('biome', 'home')
        if 'shop' in entity:
            entity_json['shop'] = entity['shop']
        if 'dialogue' in entity:
            entity_json['dialogue'] = entity['dialogue']
    
    return entity_json


def update_entity_manifest(entity_id, subfolder):
    """Update the entity manifest to include this entity"""
    manifest_path = os.path.join(BASE_DIR, 'src', 'entities', 'manifest.json')
    
    if os.path.exists(manifest_path):
        with open(manifest_path, 'r', encoding='utf-8-sig') as f:
            manifest = json.load(f)
    else:
        manifest = {'enemies': [], 'bosses': [], 'hero': True}
    
    if subfolder not in manifest:
        manifest[subfolder] = []
    
    if entity_id not in manifest[subfolder]:
        manifest[subfolder].append(entity_id)
        with open(manifest_path, 'w', encoding='utf-8-sig') as f:
            json.dump(manifest, f, indent=2)

