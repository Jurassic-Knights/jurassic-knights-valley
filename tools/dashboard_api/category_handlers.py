"""
Dashboard API - Category Handlers
CRUD operations for category data
- Gameplay data from src/entities/
- Asset metadata from src/assets/registry/
"""
import os
import json
from .utils import TOOLS_DIR, BASE_DIR

# Source folders
ENTITIES_DIR = os.path.join(BASE_DIR, 'src', 'entities')
REGISTRY_DIR = os.path.join(BASE_DIR, 'src', 'assets', 'registry')


def get_all_categories():
    """Get summary of all available entity categories"""
    categories = []
    # Categories that exist in src/entities/
    for name in ['enemies', 'bosses', 'npcs', 'equipment', 'items', 'resources', 'environment', 'nodes', 'ui']:
        cat_dir = os.path.join(ENTITIES_DIR, name)
        if os.path.exists(cat_dir):
            file_count = len([f for f in os.listdir(cat_dir) if f.endswith('.json')])
            categories.append({"name": name, "files": file_count})
    return {"categories": categories}


def get_category_data(category):
    """
    Get merged entity data:
    - Gameplay fields from src/entities/{category}/
    - Asset fields from src/assets/registry/{category}/
    """
    cat_dir = os.path.join(ENTITIES_DIR, category)
    registry_cat_dir = os.path.join(REGISTRY_DIR, category)
    
    if not os.path.exists(cat_dir):
        return {"error": f"Category not found: {category}"}
    
    # Load registry data (asset metadata) into a lookup by ID
    registry_lookup = {}
    if os.path.exists(registry_cat_dir):
        for filename in os.listdir(registry_cat_dir):
            if not filename.endswith('.json'):
                continue
            filepath = os.path.join(registry_cat_dir, filename)
            try:
                with open(filepath, 'r', encoding='utf-8-sig') as f:
                    reg_data = json.load(f)
                registry_lookup[reg_data.get('id')] = reg_data
            except Exception as e:
                print(f"Error reading registry {filepath}: {e}")
    
    # Read individual entity JSON files and merge with registry
    # For equipment, also scan subfolders (e.g., weapons/sword/, weapons/pistol/)
    entities = []
    json_files = []
    
    # Collect all JSON files (including in subdirectories for equipment)
    if category == 'equipment':
        for root, dirs, files in os.walk(cat_dir):
            for f in files:
                if f.endswith('.json'):
                    json_files.append(os.path.join(root, f))
    else:
        for f in os.listdir(cat_dir):
            if f.endswith('.json'):
                json_files.append(os.path.join(cat_dir, f))
    
    for filepath in json_files:
        try:
            with open(filepath, 'r', encoding='utf-8-sig') as f:
                entity = json.load(f)
            
            entity_id = entity.get('id')
            
            # Merge asset metadata from registry
            if entity_id in registry_lookup:
                reg_data = registry_lookup[entity_id]
                # Override with registry fields for asset metadata
                entity['status'] = reg_data.get('status', 'pending')
                # Prefer registry sourceDescription, but keep entity's if registry doesn't have one
                if reg_data.get('sourceDescription'):
                    entity['sourceDescription'] = reg_data.get('sourceDescription')
                entity['declineNote'] = reg_data.get('declineNote')
                entity['files'] = reg_data.get('files', entity.get('files', {}))
                entity['bodyType'] = reg_data.get('bodyType', entity.get('bodyType'))
                entity['gender'] = reg_data.get('gender', entity.get('gender'))
            else:
                # No registry entry - set defaults so buttons still show
                if 'status' not in entity:
                    entity['status'] = 'pending'
            
            # Add imageModifiedTime for sorting by image modification date
            files_dict = entity.get('files', {})
            original_path = files_dict.get('original', files_dict.get('clean', ''))
            if original_path:
                # Resolve to absolute path
                if original_path.startswith('assets/') or original_path.startswith('images/'):
                    abs_path = os.path.join(BASE_DIR, original_path.replace('/', os.sep))
                else:
                    abs_path = os.path.join(BASE_DIR, 'assets', original_path.replace('/', os.sep))
                if os.path.exists(abs_path):
                    entity['imageModifiedTime'] = int(os.path.getmtime(abs_path) * 1000)
                else:
                    entity['imageModifiedTime'] = 0
            else:
                entity['imageModifiedTime'] = 0
            
            # Fallback chain for sourceDescription: registry > entity > description field > name
            if not entity.get('sourceDescription'):
                entity['sourceDescription'] = entity.get('description', entity.get('name', ''))
            
            entity['_sourceFile'] = os.path.basename(filepath)
            entities.append(entity)
        except Exception as e:
            print(f"Error reading {filepath}: {e}")
    
    # Group by sourceFile for backward compatibility with dashboard
    files = {}
    for entity in entities:
        source_file = entity.get('sourceFile', category)
        if source_file not in files:
            files[source_file] = []
        files[source_file].append(entity)
    
    return {"files": files, "category": category, "entities": entities}


def update_category_status(category, filename, item_id, new_status, note=None):
    """Update the status of an entity - writes to REGISTRY, not entity JSON"""
    if not item_id or not new_status:
        return {"success": False, "error": "Missing required parameters"}
    
    # Find or create registry file
    registry_path = os.path.join(REGISTRY_DIR, category, f"{item_id}.json")
    
    if os.path.exists(registry_path):
        with open(registry_path, 'r', encoding='utf-8-sig') as f:
            registry_entry = json.load(f)
    else:
        # Create new registry entry
        registry_entry = {"id": item_id, "category": category}
    
    registry_entry['status'] = new_status
    if note:
        registry_entry['declineNote'] = note
    elif new_status != 'declined':
        registry_entry.pop('declineNote', None)
    
    os.makedirs(os.path.dirname(registry_path), exist_ok=True)
    with open(registry_path, 'w', encoding='utf-8-sig') as f:
        json.dump(registry_entry, f, indent=2)
    
    return {"success": True, "message": f"Updated {item_id} to {new_status}"}


def update_consumed_status(category, filename, item_id, new_status, note=None):
    """Update the consumed version status of an entity"""
    if not item_id or not new_status:
        return {"success": False, "error": "Missing required parameters"}
    
    entity_path = _find_entity_file(category, item_id)
    if not entity_path:
        return {"success": False, "error": f"Entity not found: {item_id}"}
    
    with open(entity_path, 'r', encoding='utf-8-sig') as f:
        entity = json.load(f)
    
    entity['consumedStatus'] = new_status
    if note:
        entity['consumedDeclineNote'] = note
    
    with open(entity_path, 'w', encoding='utf-8-sig') as f:
        json.dump(entity, f, indent=2)
    
    return {"success": True, "message": f"Updated consumed status for {item_id}"}


def update_item_stat(category, filename, item_id, stat_key, value):
    """Update a specific stat of an entity - writes directly to entity JSON"""
    if not item_id or not stat_key:
        return {"success": False, "error": "Missing required parameters"}
    
    entity_path = _find_entity_file(category, item_id)
    if not entity_path:
        return {"success": False, "error": f"Entity not found: {item_id}"}
    
    with open(entity_path, 'r', encoding='utf-8-sig') as f:
        entity = json.load(f)
    
    if 'stats' not in entity:
        entity['stats'] = {}
    entity['stats'][stat_key] = value
    
    with open(entity_path, 'w', encoding='utf-8-sig') as f:
        json.dump(entity, f, indent=2)
    
    print(f"[EntityUpdate] {item_id}.stats.{stat_key} = {value}")
    return {"success": True, "message": f"Updated {item_id}.stats.{stat_key} = {value}"}


def update_item_weapon(category, filename, item_id, weapon):
    """Update the weapon type for an enemy and sync to sourceDescription"""
    if not item_id:
        return {"success": False, "error": "Missing required parameters"}
    
    entity_path = _find_entity_file(category, item_id)
    if not entity_path:
        return {"success": False, "error": f"Entity not found: {item_id}"}
    
    with open(entity_path, 'r', encoding='utf-8-sig') as f:
        entity = json.load(f)
    
    old_weapon = entity.get('weaponType', '')
    entity['weaponType'] = weapon
    
    # Auto-sync: Update weapon in sourceDescription if present
    if 'sourceDescription' in entity and old_weapon:
        entity['sourceDescription'] = _sync_weapon_in_description(
            entity['sourceDescription'], old_weapon, weapon
        )
    
    with open(entity_path, 'w', encoding='utf-8-sig') as f:
        json.dump(entity, f, indent=2)
    
    print(f"[EntityUpdate] {item_id}.weaponType = {weapon}")
    return {"success": True, "message": f"Updated {item_id} weapon to {weapon}"}


def _sync_weapon_in_description(description, old_weapon, new_weapon):
    """
    Replace weapon terms in sourceDescription when weaponType changes.
    Maps weaponType values to visual terms.
    """
    # Weapon type to visual term mapping (with variations)
    weapon_terms = {
        'sword': ['sword', 'blade'],
        'longsword': ['longsword', 'long sword', 'bastard sword'],
        'greatsword': ['greatsword', 'great sword', 'massive sword'],
        'axe': ['axe', 'war axe', 'broad axe'],
        'war_axe': ['war axe', 'massive axe', 'battle axe'],
        'mace': ['mace', 'flanged mace', 'steel mace'],
        'war_hammer': ['war hammer', 'warhammer', 'massive hammer', 'iron maul', 'maul'],
        'lance': ['lance', 'cavalry lance'],
        'halberd': ['halberd', 'polearm'],
        'spear': ['spear', 'pike'],
        'knife': ['knife', 'dagger', 'blade'],
        'flail': ['flail', 'chain flail'],
        'rifle': ['rifle', 'bolt-action rifle'],
        'pistol': ['pistol', 'revolver', 'handgun'],
        'submachine_gun': ['submachine gun', 'smg'],
        'machine_gun': ['machine gun', 'heavy machine gun', 'belt-fed gun'],
        'flamethrower': ['flamethrower', 'flame weapon'],
        'shotgun': ['shotgun', 'trench gun'],
        'sniper_rifle': ['sniper rifle', 'marksman rifle'],
        'bazooka': ['bazooka', 'rocket launcher'],
    }
    
    # Get terms for old and new weapons
    old_terms = weapon_terms.get(old_weapon, [old_weapon.replace('_', ' ')])
    new_primary = weapon_terms.get(new_weapon, [new_weapon.replace('_', ' ')])[0]
    
    # Try to replace any old weapon term with new
    result = description
    for old_term in old_terms:
        # Case insensitive replacement
        import re
        pattern = re.compile(re.escape(old_term), re.IGNORECASE)
        if pattern.search(result):
            result = pattern.sub(new_primary, result)
            break
    
    return result




def update_item_field(category, filename, item_id, field, value):
    """Update any top-level field on an entity (e.g., gender, bodyType)"""
    if not item_id or not field:
        return {"success": False, "error": "Missing required parameters"}
    
    entity_path = _find_entity_file(category, item_id)
    if not entity_path:
        return {"success": False, "error": f"Entity not found: {item_id}"}
    
    with open(entity_path, 'r', encoding='utf-8-sig') as f:
        entity = json.load(f)
    
    entity[field] = value
    
    with open(entity_path, 'w', encoding='utf-8-sig') as f:
        json.dump(entity, f, indent=2)
    
    print(f"[EntityUpdate] {item_id}.{field} = {value}")
    return {"success": True, "message": f"Updated {item_id}.{field} = {value}"}


def _find_entity_file(category, item_id):
    """Find entity JSON file by ID, searching in category folder (and subfolders for equipment)"""
    # Direct path: src/entities/{category}/{item_id}.json
    direct_path = os.path.join(ENTITIES_DIR, category, f"{item_id}.json")
    if os.path.exists(direct_path):
        return direct_path
    
    # Try with enemy_ prefix for enemies
    if category in ['enemies', 'bosses']:
        prefixed_path = os.path.join(ENTITIES_DIR, category, f"enemy_{item_id}.json")
        if os.path.exists(prefixed_path):
            return prefixed_path
    
    # Search all files in the category (recursively for equipment)
    cat_dir = os.path.join(ENTITIES_DIR, category)
    if os.path.exists(cat_dir):
        if category == 'equipment':
            # Recursive search for equipment (weapons in subfolders)
            for root, dirs, files in os.walk(cat_dir):
                for filename in files:
                    if not filename.endswith('.json'):
                        continue
                    filepath = os.path.join(root, filename)
                    try:
                        with open(filepath, 'r', encoding='utf-8-sig') as f:
                            entity = json.load(f)
                        if entity.get('id') == item_id:
                            return filepath
                    except:
                        pass
        else:
            # Flat search for other categories
            for filename in os.listdir(cat_dir):
                if not filename.endswith('.json'):
                    continue
                filepath = os.path.join(cat_dir, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8-sig') as f:
                        entity = json.load(f)
                    if entity.get('id') == item_id:
                        return filepath
                except:
                    pass
    
    # Also check bosses if looking in enemies
    if category == 'enemies':
        return _find_entity_file('bosses', item_id)
    
    return None

