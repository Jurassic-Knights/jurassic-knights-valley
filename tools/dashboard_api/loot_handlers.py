"""
Dashboard API - Loot Handlers
Loot table operations
"""
import os
import json
from .utils import TOOLS_DIR


def get_loot_data():
    """Get loot data by merging all files from loot/ folder"""
    loot_dir = os.path.join(TOOLS_DIR, "loot")
    if not os.path.exists(loot_dir):
        loot_file = os.path.join(TOOLS_DIR, "loot_data.json")
        if os.path.exists(loot_file):
            with open(loot_file, 'r', encoding='utf-8-sig') as f:
                return json.load(f)
        return {"error": "loot folder not found"}
    
    result = {"resources": [], "items": [], "equipment": [], "lootTables": [], "sets": []}
    
    for filename in os.listdir(loot_dir):
        if not filename.endswith('.json'):
            continue
        filepath = os.path.join(loot_dir, filename)
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
        
        if filename == '_config.json':
            result.update(data)
        elif filename.startswith('resources_'):
            for item in data:
                item['category'] = filename.replace('resources_', '').replace('.json', '')
            result['resources'].extend(data)
        elif filename.startswith('items_'):
            result['items'].extend(data)
        elif filename.startswith('equipment_'):
            result['equipment'].extend(data)
        elif filename.startswith('enemies_'):
            result['lootTables'].extend(data)
        elif filename == 'sets.json':
            result['sets'].extend(data)
    
    return result


def update_loot_status(item_type, item_id, new_status, note=None):
    """Update the status of a loot item"""
    if not item_type or not item_id or not new_status:
        return {"success": False, "error": "Missing type, id, or status"}
    
    loot_dir = os.path.join(TOOLS_DIR, "loot")
    if not os.path.exists(loot_dir):
        return {"success": False, "error": "loot folder not found"}
    
    found = False
    target_file = None
    target_data = None
    target_index = None
    
    for filename in os.listdir(loot_dir):
        if not filename.endswith('.json') or filename == '_config.json':
            continue
        
        # Match item type to file prefix
        if item_type == 'resources' and not filename.startswith('resources_'):
            continue
        elif item_type == 'items' and not filename.startswith('items_'):
            continue
        elif item_type == 'equipment' and not filename.startswith('equipment_'):
            continue
        elif item_type == 'lootTables' and not filename.startswith('enemies_'):
            continue
        elif item_type == 'sets' and filename != 'sets.json':
            continue
        
        filepath = os.path.join(loot_dir, filename)
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
        
        for i, item in enumerate(data):
            if item.get("id") == item_id or item.get("enemy") == item_id:
                found = True
                target_file = filepath
                target_data = data
                target_index = i
                break
        
        if found:
            break
    
    if not found:
        return {"success": False, "error": f"Item not found: {item_id}"}
    
    target_data[target_index]['status'] = new_status
    if note:
        target_data[target_index]['declineNote'] = note
    
    with open(target_file, 'w', encoding='utf-8-sig') as f:
        json.dump(target_data, f, indent=4)
    
    return {"success": True, "message": f"Updated loot status for {item_id} to {new_status}"}

