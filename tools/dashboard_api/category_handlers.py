"""
Dashboard API - Category Handlers
CRUD operations for entity data stored in src/entities/ (.ts files)
"""
import os
import json
from .utils import TOOLS_DIR, BASE_DIR

# Source folder for entity TypeScript files
ENTITIES_DIR = os.path.join(BASE_DIR, 'src', 'entities')


def get_all_categories():
    """Get summary of all available entity categories"""
    categories = []
    # Categories that exist in src/entities/
    for name in ['enemies', 'bosses', 'npcs', 'equipment', 'items', 'resources', 'environment', 'nodes', 'ui', 'hero']:
        cat_dir = os.path.join(ENTITIES_DIR, name)
        if os.path.exists(cat_dir):
            file_count = len([f for f in os.listdir(cat_dir) if f.endswith('.ts') and f != 'index.ts'])
            categories.append({"name": name, "files": file_count})
    return {"categories": categories}


def get_category_data(category):
    """
    Get entity data directly from src/entities/{category}/ (.ts files)
    All data (gameplay + asset metadata) is stored in the entity TS files.
    """
    cat_dir = os.path.join(ENTITIES_DIR, category)
    
    if not os.path.exists(cat_dir):
        return {"error": f"Category not found: {category}"}
    
    entities = []
    ts_files = []
    
    # Collect all TypeScript entity files (including in subdirectories for equipment)
    if category == 'equipment':
        for root, dirs, files in os.walk(cat_dir):
            for f in files:
                if f.endswith('.ts') and f != 'index.ts':
                    ts_files.append(os.path.join(root, f))
    else:
        for f in os.listdir(cat_dir):
            if f.endswith('.ts') and f != 'index.ts':
                ts_files.append(os.path.join(cat_dir, f))
    
    for filepath in ts_files:
        try:
            entity = _read_ts_entity(filepath)
            if not entity:
                continue
            
            # Set default status if not present
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
            
            # Fallback for sourceDescription
            if not entity.get('sourceDescription'):
                entity['sourceDescription'] = entity.get('description', entity.get('name', ''))
            
            entity['_sourceFile'] = os.path.basename(filepath).replace('.ts', '')
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
    """Update the status of an entity - writes directly to entity TS file"""
    if not item_id or not new_status:
        return {"success": False, "error": "Missing required parameters"}
    
    entity_path = _find_entity_file(category, item_id)
    if not entity_path:
        return {"success": False, "error": f"Entity not found: {item_id}"}
    
    entity = _read_ts_entity(entity_path)
    if not entity:
        return {"success": False, "error": f"Could not parse entity: {item_id}"}
    
    entity['status'] = new_status
    if note:
        entity['declineNote'] = note
    elif new_status != 'declined' and 'declineNote' in entity:
        del entity['declineNote']
    
    _write_ts_entity(entity_path, entity)
    
    print(f"[EntityUpdate] {item_id} status = {new_status}")
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
    """Update any field on an entity. Supports nested fields with dot notation (e.g., display.sizeScale)"""
    if not item_id or not field:
        return {"success": False, "error": "Missing required parameters"}
    
    entity_path = _find_entity_file(category, item_id)
    if not entity_path:
        return {"success": False, "error": f"Entity not found: {item_id}"}
    
    # Read entity from TypeScript file
    entity = _read_ts_entity(entity_path)
    if not entity:
        return {"success": False, "error": f"Could not parse entity: {item_id}"}
    
    # Handle nested fields with dot notation (e.g., "display.sizeScale")
    if '.' in field:
        parts = field.split('.', 1)  # Split into parent and child
        parent_key = parts[0]
        child_key = parts[1]
        if parent_key not in entity:
            entity[parent_key] = {}
        entity[parent_key][child_key] = value
        print(f"[EntityUpdate] {item_id}.{parent_key}.{child_key} = {value}")
    else:
        entity[field] = value
        print(f"[EntityUpdate] {item_id}.{field} = {value}")
    
    # Write entity back to TypeScript file
    _write_ts_entity(entity_path, entity)
    
    print(f"[EntityUpdate] Saved {item_id}.{field} = {value}")
    return {"success": True, "message": f"Updated {item_id}.{field} = {value}"}


def update_entity(category, filename, item_id, updates):
    """
    Unified update function that can apply multiple field updates at once.
    All updates go directly to the entity TS file.
    Supports nested fields with dot notation (e.g., stats.health, display.sizeScale)
    """
    if not item_id or not updates:
        return {"success": False, "error": "Missing required parameters"}
    
    entity_path = _find_entity_file(category, item_id)
    if not entity_path:
        return {"success": False, "error": f"Entity not found: {item_id}"}
    
    entity = _read_ts_entity(entity_path)
    if not entity:
        return {"success": False, "error": f"Could not parse entity: {item_id}"}
    
    for field, value in updates.items():
        # Handle nested fields with dot notation
        if '.' in field:
            parts = field.split('.', 1)
            parent_key = parts[0]
            child_key = parts[1]
            if parent_key not in entity:
                entity[parent_key] = {}
            entity[parent_key][child_key] = value
        elif value is None and field in entity:
            # Remove field if value is None
            del entity[field]
        else:
            entity[field] = value
    
    _write_ts_entity(entity_path, entity)
    print(f"[EntityUpdate] {item_id} updated: {list(updates.keys())}")
    
    return {"success": True, "message": f"Updated {item_id}"}


def _find_entity_file(category, item_id):
    """Find entity TypeScript file by ID, searching in category folder (and subfolders for equipment)"""
    # Direct path: src/entities/{category}/{item_id}.ts
    direct_path = os.path.join(ENTITIES_DIR, category, f"{item_id}.ts")
    if os.path.exists(direct_path):
        return direct_path
    
    # Try with enemy_ prefix for enemies
    if category in ['enemies', 'bosses']:
        prefixed_path = os.path.join(ENTITIES_DIR, category, f"enemy_{item_id}.ts")
        if os.path.exists(prefixed_path):
            return prefixed_path
    
    # Search all files in the category (recursively for equipment)
    cat_dir = os.path.join(ENTITIES_DIR, category)
    if os.path.exists(cat_dir):
        if category == 'equipment':
            # Recursive search for equipment (weapons in subfolders)
            for root, dirs, files in os.walk(cat_dir):
                for filename in files:
                    if not filename.endswith('.ts'):
                        continue
                    filepath = os.path.join(root, filename)
                    try:
                        entity = _read_ts_entity(filepath)
                        if entity and entity.get('id') == item_id:
                            return filepath
                    except:
                        pass
        else:
            # Flat search for other categories
            for filename in os.listdir(cat_dir):
                if not filename.endswith('.ts'):
                    continue
                filepath = os.path.join(cat_dir, filename)
                try:
                    entity = _read_ts_entity(filepath)
                    if entity and entity.get('id') == item_id:
                        return filepath
                except:
                    pass
    
    # Also check bosses if looking in enemies
    if category == 'enemies':
        return _find_entity_file('bosses', item_id)
    
    return None


def _read_ts_entity(filepath):
    """Read entity data from a TypeScript module file"""
    import re
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract JSON object from: export default { ... } satisfies ...
    match = re.search(r'export\s+default\s+(\{[\s\S]*\})\s*satisfies', content)
    if match:
        json_str = match.group(1)
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            # Try fixing trailing commas
            fixed = re.sub(r',(\s*[}\]])', r'\1', json_str)
            try:
                return json.loads(fixed)
            except:
                pass
    
    # Try simpler pattern: export default { ... };
    match = re.search(r'export\s+default\s+(\{[\s\S]*\});?\s*$', content)
    if match:
        json_str = match.group(1)
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            fixed = re.sub(r',(\s*[}\]])', r'\1', json_str)
            try:
                return json.loads(fixed)
            except:
                pass
    
    return None


def _write_ts_entity(filepath, entity):
    """Write entity data to a TypeScript module file"""
    # Determine entity type from category
    import os
    rel_path = os.path.relpath(filepath, ENTITIES_DIR)
    category = rel_path.split(os.sep)[0]
    
    type_map = {
        'enemies': 'EnemyEntity',
        'bosses': 'BossEntity',
        'equipment': 'EquipmentEntity',
        'items': 'ItemEntity',
        'resources': 'ResourceEntity',
        'nodes': 'NodeEntity',
        'environment': 'EnvironmentEntity',
        'npcs': 'NPCEntity',
        'hero': 'HeroEntity'
    }
    entity_type = type_map.get(category, 'BaseEntity')
    
    # Format JSON nicely
    json_str = json.dumps(entity, indent=4, ensure_ascii=False)
    
    # Build TypeScript content
    ts_content = f"""/**
 * Entity: {entity.get('id', 'unknown')}
 * Auto-generated. Edit in dashboard.
 */
import type {{ {entity_type} }} from '@types/entities';

export default {json_str} satisfies {entity_type};
"""
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(ts_content)
