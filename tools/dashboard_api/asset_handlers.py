"""
Dashboard API - Asset Handlers
Asset approval, sync to game, and AssetLoader.js generation
"""
import os
import json
import shutil
from datetime import datetime
from .utils import BASE_DIR, IMAGES_DIR, TOOLS_DIR, get_status


def regenerate_asset_loader():
    """
    Scan all tools/ JSON registries and regenerate AssetLoader.js
    with all assets that have status 'clean' or 'approved'
    """
    image_assets = {}
    audio_assets = {}
    
    # Categories to scan for images
    image_categories = ['enemies', 'npcs', 'equipment', 'items', 'resources', 'environment', 'ui', 'buildings', 'props', 'vfx', 'loot']
    
    for category in image_categories:
        cat_dir = os.path.join(TOOLS_DIR, category)
        if not os.path.exists(cat_dir):
            continue
        
        for filename in os.listdir(cat_dir):
            if not filename.endswith('.json') or filename.startswith('_') or filename == 'asset_queue.json':
                continue
            
            filepath = os.path.join(cat_dir, filename)
            try:
                with open(filepath, 'r', encoding='utf-8-sig') as f:
                    data = json.load(f)
                
                if not isinstance(data, list):
                    continue
                
                for item in data:
                    # Skip if item is not a dict (could be string or other type)
                    if not isinstance(item, dict):
                        continue
                    status = item.get('status', 'pending')
                    if status not in ['clean', 'approved']:
                        continue
                    
                    asset_id = item.get('id')
                    if not asset_id:
                        continue
                    
                    files = item.get('files', {})
                    clean_path = files.get('clean')
                    
                    if clean_path:
                        if clean_path.startswith('assets/'):
                            clean_path = clean_path[7:]
                        image_assets[asset_id] = {"path": clean_path}
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
    
    # Scan audio category
    audio_dir = os.path.join(TOOLS_DIR, 'audio')
    if os.path.exists(audio_dir):
        for filename in os.listdir(audio_dir):
            if not filename.endswith('.json') or filename.startswith('_'):
                continue
            
            filepath = os.path.join(audio_dir, filename)
            try:
                with open(filepath, 'r', encoding='utf-8-sig') as f:
                    data = json.load(f)
                
                if not isinstance(data, list):
                    continue
                
                for item in data:
                    # Skip if item is not a dict
                    if not isinstance(item, dict):
                        continue
                    status = item.get('status', 'pending')
                    if status not in ['clean', 'approved']:
                        continue
                    
                    asset_id = item.get('id')
                    path = item.get('path')
                    if asset_id and path:
                        audio_assets[asset_id] = {
                            "path": path,
                            "volume": item.get('volume', 1.0)
                        }
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
    
    # Essential hardcoded assets
    essential_images = {
        "world_base_layer": {"path": "images/backgrounds/base_layer.png"},
        "world_island_home": {"path": "images/backgrounds/zone_home_clean.png"},
        "world_bridge_planks": {"path": "images/environment/environment_planks.png"},
        "world_hero": {"path": "images/characters/world_hero_2_clean.png"},
        "ui_avatar_knight": {"path": "images/characters/avatar_knight.png"},
        "vfx_fog": {"path": "images/vfx/fog.png"},
        "vfx_fog_puff": {"path": "images/vfx/fog_dense.png"},
    }
    
    for asset_id, asset_data in essential_images.items():
        if asset_id not in image_assets:
            image_assets[asset_id] = asset_data
    
    essential_audio = {
        "sfx_hero_shoot": {"path": "audio/hero_shoot.wav", "volume": 0.8},
        "sfx_ui_click": {"path": "audio/ui_click.wav", "volume": 0.5},
    }
    
    for asset_id, asset_data in essential_audio.items():
        if asset_id not in audio_assets:
            audio_assets[asset_id] = asset_data
    
    # Generate AssetLoader.js content
    image_lines = []
    for asset_id, asset_data in sorted(image_assets.items()):
        path = asset_data.get('path', '')
        image_lines.append(f'                "{asset_id}": {{ "path": "{path}" }}')
    
    audio_lines = []
    for asset_id, asset_data in sorted(audio_assets.items()):
        path = asset_data.get('path', '')
        volume = asset_data.get('volume', 1.0)
        audio_lines.append(f'                "{asset_id}": {{ "path": "{path}", "volume": {volume} }}')
    
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
    new_content = _generate_asset_loader_content(timestamp, image_lines, audio_lines)
    
    asset_loader_path = os.path.join(BASE_DIR, 'src', 'core', 'AssetLoader.js')
    with open(asset_loader_path, 'w', encoding='utf-8-sig') as f:
        f.write(new_content)
    
    print(f"[Dashboard] Regenerated AssetLoader.js with {len(image_assets)} images, {len(audio_assets)} audio assets")
    return {"success": True, "images": len(image_assets), "audio": len(audio_assets)}


def _generate_asset_loader_content(timestamp, image_lines, audio_lines):
    """Generate the AssetLoader.js file content"""
    return f'''const AssetLoader = {{
    // Registry auto-generated: {timestamp}
    // DO NOT EDIT MANUALLY - regenerated by dashboard
    registries: {{ images: null, audio: null, vfx: null }},
    cache: new Map(),
    basePath: 'assets/',

    async init() {{
        this.registries.images = {{
            assets: {{
{(','+chr(10)).join(image_lines)}
            }}
        }};
        this.registries.audio = {{
            assets: {{
{(','+chr(10)).join(audio_lines)}
            }}
        }};
        this.registries.vfx = {{ presets: {{}} }};
        console.log('[AssetLoader] Loaded ' + Object.keys(this.registries.images.assets).length + ' images');
        return true;
    }},

    getImagePath(id) {{
        const asset = this.registries.images?.assets?.[id];
        if (!asset) {{
            console.warn(`[AssetLoader] Image not found: ${{id}}`);
            return this.basePath + 'images/PH.png';
        }}
        if (asset.path.includes('_original')) {{
            return this.basePath + 'images/PH.png';
        }}
        return this.basePath + asset.path;
    }},

    getImage(id) {{ return this.cache.get(id) || null; }},

    createImage(src, onLoad) {{
        const img = new Image();
        img.onerror = () => {{ img.src = this.basePath + 'images/PH.png'; }};
        if (onLoad) img.onload = onLoad;
        img.src = src;
        return img;
    }},

    getAudio(id) {{
        const asset = this.registries.audio?.assets?.[id];
        if (!asset) return null;
        return {{ path: this.basePath + asset.path, volume: asset.volume ?? 1, loop: asset.loop ?? false }};
    }},

    getVFXPreset(id) {{ return this.registries.vfx?.presets?.[id] ?? null; }},

    async preloadImage(id) {{
        if (this.cache.has(id)) return this.cache.get(id);
        const path = this.getImagePath(id);
        if (!path) return null;
        return new Promise((resolve) => {{
            const img = new Image();
            img.onload = () => {{ this.cache.set(id, img); resolve(img); }};
            img.onerror = () => {{ resolve(null); }};
            img.src = path;
        }});
    }}
}};

window.AssetLoader = AssetLoader;
'''


def change_status(path, new_status):
    """Change asset approval status via file rename"""
    if not path or not new_status:
        return {"success": False, "error": "Missing path or status"}
    
    full_path = os.path.join(IMAGES_DIR, path)
    if not os.path.exists(full_path):
        return {"success": False, "error": f"File not found: {path}"}
    
    dir_path = os.path.dirname(full_path)
    old_name = os.path.basename(path)
    
    # Strip existing status tokens
    base = old_name
    for token in ['_approved', '_declined']:
        base = base.replace(token, '')
    
    is_original = '_original' in base
    
    if is_original:
        base_no_original = base.replace('_original', '')
        ext = os.path.splitext(base_no_original)[1] or '.png'
        base_name = os.path.splitext(base_no_original)[0]
        
        if new_status == 'approved':
            new_name = f"{base_name}_approved_original{ext}"
        elif new_status == 'declined':
            new_name = f"{base_name}_declined_original{ext}"
        else:
            new_name = f"{base_name}_original{ext}"
    else:
        ext = os.path.splitext(base)[1] or '.png'
        base_name = os.path.splitext(base.replace('_clean', ''))[0]
        new_name = f"{base_name}_{new_status}{ext}"
    
    new_path = os.path.join(dir_path, new_name)
    
    try:
        shutil.move(full_path, new_path)
        return {"success": True, "newName": new_name, "newPath": os.path.relpath(new_path, IMAGES_DIR).replace("\\", "/")}
    except Exception as e:
        return {"success": False, "error": str(e)}

