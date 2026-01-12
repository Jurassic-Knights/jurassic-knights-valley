"""
Asset Dashboard Server
Run this to serve the dashboard with full filesystem access.
Port: 8765 (unique to Jurassic Knights project)
"""
import os
import sys
import json
import shutil
import http.server
import socketserver
from urllib.parse import parse_qs, urlparse

PORT = 8765
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES_DIR = os.path.join(BASE_DIR, "assets", "images")
TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))

def get_status(filename):
    if "_clean" in filename: return "clean"
    if "_final" in filename: return "final"
    if "_approved" in filename: return "approved"
    if "_declined" in filename: return "declined"
    if "_original" in filename: return "pending"
    return "unknown"

def scan_assets():
    assets = []
    for root, dirs, files in os.walk(IMAGES_DIR):
        rel_path = os.path.relpath(root, IMAGES_DIR)
        category = rel_path.split(os.sep)[0] if rel_path != "." else "root"
        for file in files:
            if not file.lower().endswith(('.png', '.jpg', '.jpeg')): continue
            if file.startswith('.'): continue
            full_path = os.path.join(root, file)
            rel_file_path = os.path.relpath(full_path, IMAGES_DIR)
            assets.append({
                "name": file,
                "path": rel_file_path.replace("\\", "/"),
                "category": category,
                "status": get_status(file)
            })
    return assets

def get_manifest():
    assets = scan_assets()
    counts = {}
    for a in assets:
        counts[a["status"]] = counts.get(a["status"], 0) + 1
    return {"generated": True, "basePath": "/images/", "assets": assets, "counts": counts}

def regenerate_asset_loader():
    """
    Scan all tools/ JSON registries and regenerate AssetLoader.js
    with all assets that have status 'clean' or 'approved'
    """
    from datetime import datetime
    
    image_assets = {}
    audio_assets = {}
    
    # Categories to scan for images (all tools/ subdirectories with assets)
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
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                if not isinstance(data, list):
                    continue
                
                for item in data:
                    status = item.get('status', 'pending')
                    if status not in ['clean', 'approved']:
                        continue
                    
                    asset_id = item.get('id')
                    if not asset_id:
                        continue
                    
                    # Get the clean file path
                    files = item.get('files', {})
                    clean_path = files.get('clean')
                    
                    if clean_path:
                        # Normalize path: remove 'assets/' prefix if present
                        if clean_path.startswith('assets/'):
                            clean_path = clean_path[7:]
                        image_assets[asset_id] = {"path": clean_path}
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
    
    # Scan audio category
    audio_dir = os.path.join(TOOLS_DIR, 'audio')
    if os.path.exists(audio_dir):
        for filename in os.listdir(audio_dir):
            if not filename.endswith('.json') or filename.startswith('_') or filename == 'asset_queue.json':
                continue
            
            filepath = os.path.join(audio_dir, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                if not isinstance(data, list):
                    continue
                
                for item in data:
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
    
    # Read original AssetLoader.js to preserve essential hardcoded assets
    asset_loader_path = os.path.join(BASE_DIR, 'src', 'core', 'AssetLoader.js')
    
    # Read original file to get the template structure
    with open(asset_loader_path, 'r', encoding='utf-8') as f:
        original_content = f.read()
    
    # Hardcoded essential assets that should always exist
    essential_images = {
        "world_base_layer": {"path": "images/backgrounds/base_layer.png"},
        "world_island_home": {"path": "images/backgrounds/zone_home_clean.png"},
        "world_bridge_planks": {"path": "images/environment/environment_planks.png"},
        "zone_quarry_fields": {"path": "images/backgrounds/zone_quarry_fields_clean.png"},
        "zone_iron_ridge": {"path": "images/backgrounds/zone_iron_ridge_clean.png"},
        "zone_dead_woods": {"path": "images/backgrounds/zone_dead_woods_clean.png"},
        "zone_crossroads": {"path": "images/backgrounds/zone_crossroads_clean.png"},
        "zone_scrap_yard": {"path": "images/backgrounds/zone_scrap_yard_clean.png"},
        "zone_mud_flats": {"path": "images/backgrounds/zone_mud_flats_clean.png"},
        "zone_bone_valley": {"path": "images/backgrounds/zone_bone_valley_clean.png"},
        "zone_the_ruins": {"path": "images/backgrounds/zone_the_ruins_clean.png"},
        "world_hero": {"path": "images/characters/world_hero_2_clean.png"},
        "ui_avatar_knight": {"path": "images/characters/avatar_knight.png"},
        "vfx_fog": {"path": "images/vfx/fog.png"},
        "vfx_fog_puff": {"path": "images/vfx/fog_dense.png"},
        # Dinosaurs
        "dino_velociraptor_base": {"path": "images/dinosaurs/dino_velociraptor_base_clean.png"},
        "dino_tyrannosaurus_base": {"path": "images/dinosaurs/dino_tyrannosaurus_base_clean.png"},
        "dino_triceratops_base": {"path": "images/dinosaurs/dino_triceratops_base_clean.png"},
        "dino_ankylosaurus_base": {"path": "images/dinosaurs/dino_ankylosaurus_base_clean.png"},
        "dino_parasaurolophus_base": {"path": "images/dinosaurs/dino_parasaurolophus_base_clean.png"},
        "dino_stegosaurus_base": {"path": "images/dinosaurs/dino_stegosaurus_base_clean.png"},
        "dino_spinosaurus_base": {"path": "images/dinosaurs/dino_spinosaurus_base_clean.png"},
        "dino_base": {"path": "images/dinosaurs/dino_parasaurolophus_base_clean.png"},
        "dino_pteranodon_base": {"path": "images/dinosaurs/dino_pteranodon_base_clean.png"},
        # NPC Merchants
        "npc_merchant_quarry": {"path": "images/characters/npc_merchant_quarry_clean.png"},
        "npc_merchant_iron": {"path": "images/characters/npc_merchant_iron_clean.png"},
        "npc_merchant_dead": {"path": "images/characters/npc_merchant_dead_clean.png"},
        "npc_merchant_cross": {"path": "images/characters/npc_merchant_cross_clean.png"},
        "npc_merchant_scrap": {"path": "images/characters/npc_merchant_scrap_clean.png"},
        "npc_merchant_mud": {"path": "images/characters/npc_merchant_mud_clean.png"},
        "npc_merchant_bone": {"path": "images/characters/npc_merchant_bone_clean.png"},
        "npc_merchant_ruins": {"path": "images/characters/npc_merchant_ruins_clean.png"},
    }
    
    # Merge: dashboard assets override essentials, then add essentials for any missing
    for asset_id, asset_data in essential_images.items():
        if asset_id not in image_assets:
            image_assets[asset_id] = asset_data
    
    # Essential audio assets
    essential_audio = {
        "sfx_hero_shoot": {"path": "audio/hero_shoot.wav", "volume": 0.8},
        "sfx_hero_swing": {"path": "audio/hero_swing.wav", "volume": 0.6},
        "sfx_hero_impact_flesh": {"path": "audio/hero_impact_flesh.wav", "volume": 0.7},
        "sfx_hero_impact_metal": {"path": "audio/hero_impact_metal.wav", "volume": 0.7},
        "sfx_hero_step": {"path": "audio/hero_step.wav", "volume": 0.3},
        "sfx_resource_break_wood": {"path": "audio/resource_break_wood.wav", "volume": 0.8},
        "sfx_resource_break_stone": {"path": "audio/resource_break_stone.wav", "volume": 0.8},
        "sfx_resource_break_metal": {"path": "audio/resource_break_metal.wav", "volume": 0.8},
        "sfx_resource_collect": {"path": "audio/resource_collect.wav", "volume": 0.6},
        "sfx_dino_roar": {"path": "audio/dino_roar.wav", "volume": 1.0},
        "sfx_dino_attack": {"path": "audio/dino_attack.wav", "volume": 0.8},
        "sfx_dino_hurt": {"path": "audio/dino_hurt.wav", "volume": 0.7},
        "sfx_dino_death": {"path": "audio/dino_death.wav", "volume": 0.9},
        "sfx_dino_respawn": {"path": "audio/dino_respawn.wav", "volume": 0.9},
        "sfx_ui_click": {"path": "audio/ui_click.wav", "volume": 0.5},
        "sfx_ui_error": {"path": "audio/ui_error.wav", "volume": 0.5},
        "sfx_ui_purchase": {"path": "audio/ui_purchase.wav", "volume": 0.7},
        "sfx_ui_unlock": {"path": "audio/ui_unlock.wav", "volume": 1.0},
        "sfx_level_up": {"path": "audio/level_up.wav", "volume": 0.8},
    }
    
    for asset_id, asset_data in essential_audio.items():
        if asset_id not in audio_assets:
            audio_assets[asset_id] = asset_data
    
    # Generate image assets JS string
    image_lines = []
    for asset_id, asset_data in sorted(image_assets.items()):
        path = asset_data.get('path', '')
        image_lines.append(f'                "{asset_id}": {{ "path": "{path}" }}')
    
    # Generate audio assets JS string
    audio_lines = []
    for asset_id, asset_data in sorted(audio_assets.items()):
        path = asset_data.get('path', '')
        volume = asset_data.get('volume', 1.0)
        audio_lines.append(f'                "{asset_id}": {{ "path": "{path}", "volume": {volume} }}')
    
    # Build the new AssetLoader.js content
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
    new_content = f'''const AssetLoader = {{
    // Registry auto-generated: {timestamp}
    // DO NOT EDIT MANUALLY - this file is regenerated by dashboard when assets are approved
    registries: {{
        images: null,
        audio: null,
        vfx: null
    }},
    cache: new Map(),
    basePath: 'assets/',

    /**
     * Initialize the asset loader with embedded registry data
     * (Avoids CORS issues when running from file:// protocol)
     */
    async init() {{
        // Embedded image registry data (auto-generated from dashboard)
        this.registries.images = {{
            assets: {{
{(','+chr(10)).join(image_lines)}
            }}
        }};

        // Embedded audio registry data (auto-generated from dashboard)
        this.registries.audio = {{
            assets: {{
{(','+chr(10)).join(audio_lines)}
            }}
        }};
        this.registries.vfx = {{ presets: {{}} }};

        console.log('[AssetLoader] Registries loaded (auto-generated, ' + Object.keys(this.registries.images.assets).length + ' images, ' + Object.keys(this.registries.audio.assets).length + ' audio)');
        return true;
    }},

    /**
     * Get image path by ID
     * @param {{string}} id - Asset ID (e.g., 'ui_btn_primary')
     * @returns {{string|null}} - File path or null if not found
     */
    getImagePath(id) {{
        const asset = this.registries.images?.assets?.[id];
        if (!asset) {{
            console.warn(`[AssetLoader] Image not found: ${{id}}, using placeholder`);
            return this.basePath + 'images/PH.png';
        }}

        // SAFETY: Never allow _original assets in production
        if (asset.path.includes('_original')) {{
            console.error(`[AssetLoader] BLOCKED: Cannot use _original asset: ${{asset.path}}`);
            return this.basePath + 'images/PH.png';
        }}

        return this.basePath + asset.path;
    }},

    /**
     * Get cached image object
     * @param {{string}} id
     * @returns {{HTMLImageElement|null}}
     */
    getImage(id) {{
        return this.cache.get(id) || null;
    }},

    /**
     * Create an image element with automatic fallback to PH.png on error
     * @param {{string}} src - Image source path
     * @param {{function}} onLoad - Optional callback when loaded
     * @returns {{HTMLImageElement}}
     */
    createImage(src, onLoad) {{
        const img = new Image();
        img.onerror = () => {{
            console.warn(`[AssetLoader] Image load failed: ${{src}}, using placeholder`);
            img.src = this.basePath + 'images/PH.png';
        }};
        if (onLoad) {{
            img.onload = onLoad;
        }}
        img.src = src;
        return img;
    }},

    /**
     * Get audio path by ID
     * @param {{string}} id - Asset ID (e.g., 'sfx_click')
     * @returns {{object|null}} - Audio config or null if not found
     */
    getAudio(id) {{
        const asset = this.registries.audio?.assets?.[id];
        if (!asset) {{
            console.warn(`[AssetLoader] Audio not found: ${{id}}`);
            return null;
        }}
        return {{
            path: this.basePath + asset.path,
            volume: asset.volume ?? 1,
            loop: asset.loop ?? false
        }};
    }},

    /**
     * Get VFX preset by ID
     * @param {{string}} id - Preset ID
     * @returns {{object|null}} - Preset config or null
     */
    getVFXPreset(id) {{
        return this.registries.vfx?.presets?.[id] ?? null;
    }},

    /**
     * Preload an image and cache it
     * @param {{string}} id - Asset ID
     * @returns {{Promise<HTMLImageElement>}}
     */
    async preloadImage(id) {{
        if (this.cache.has(id)) {{
            return this.cache.get(id);
        }}

        const path = this.getImagePath(id);
        if (!path) return null;

        return new Promise((resolve) => {{
            const img = new Image();
            img.onload = () => {{
                this.cache.set(id, img);
                resolve(img);
            }};
            img.onerror = () => {{
                console.warn(`[AssetLoader] Image failed to load: ${{path}}, using placeholder`);
                const placeholder = new Image();
                placeholder.onload = () => {{
                    this.cache.set(id, placeholder);
                    resolve(placeholder);
                }};
                placeholder.onerror = () => {{
                    resolve(null);
                }};
                placeholder.src = this.basePath + 'images/PH.png';
            }};
            img.src = path;
        }});
    }}
}};

// Export for global access
window.AssetLoader = AssetLoader;
'''
    
    # Write the new AssetLoader.js
    with open(asset_loader_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"[Dashboard] Regenerated AssetLoader.js with {len(image_assets)} images, {len(audio_assets)} audio assets")
    return {"success": True, "images": len(image_assets), "audio": len(audio_assets)}

class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=TOOLS_DIR, **kwargs)
    
    def send_json(self, data):
        """Send JSON response"""
        response = json.dumps(data).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(response))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(response)
    
    def serve_file(self, filepath, content_type=None):
        """Send a file with appropriate content type"""
        import mimetypes
        if content_type is None:
            content_type, _ = mimetypes.guess_type(filepath)
            if content_type is None:
                content_type = 'application/octet-stream'
        
        try:
            with open(filepath, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', len(content))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, str(e))
    
    def send_source_file(self, filepath):
        """Send a source file (JS, CSS, etc.)"""
        import mimetypes
        content_type, _ = mimetypes.guess_type(filepath)
        if content_type is None:
            if filepath.endswith('.js'):
                content_type = 'application/javascript'
            elif filepath.endswith('.css'):
                content_type = 'text/css'
            else:
                content_type = 'text/plain'
        self.serve_file(filepath, content_type)
    
    def do_GET(self):
        try:
            parsed = urlparse(self.path)
            print(f"GET request: {parsed.path}")  # DEBUG
            
            # Serve modular dashboard as default page
            if parsed.path == "/" or parsed.path == "":
                self.send_response(302)
                self.send_header('Location', '/dashboard/')
                self.end_headers()
                return
            
            # === MODULAR DASHBOARD ROUTES ===
            # Serve modular dashboard at /dashboard/
            elif parsed.path == "/dashboard" or parsed.path == "/dashboard/":
                dashboard_index = os.path.join(TOOLS_DIR, "dashboard", "index.html")
                if os.path.exists(dashboard_index):
                    self.serve_file(dashboard_index, content_type="text/html")
                else:
                    self.send_error(404, "Modular dashboard index.html not found")
                return
            
            # Serve modular dashboard assets (css, js)
            elif parsed.path.startswith("/dashboard/"):
                rel_path = parsed.path[11:]  # Remove "/dashboard/"
                file_path = os.path.join(TOOLS_DIR, "dashboard", rel_path)
                if os.path.exists(file_path):
                    self.serve_file(file_path)
                else:
                    self.send_error(404)
                return
            
            # === GAME ROUTES ===
            # Serve game at /game/ path
            elif parsed.path == "/game" or parsed.path == "/game/":
                game_index = os.path.join(BASE_DIR, "index.html")
                if os.path.exists(game_index):
                    self.serve_file(game_index, content_type="text/html")
                else:
                    self.send_error(404, "Game index.html not found")
                return

            
            # Serve game assets (images, audio, etc.)
            elif parsed.path.startswith("/assets/"):
                asset_path = os.path.join(BASE_DIR, parsed.path[1:])  # Remove leading /
                if os.path.exists(asset_path):
                    self.serve_file(asset_path)
                else:
                    self.send_error(404)
                return
            
            # Serve game source files for /game/ context
            elif parsed.path.startswith("/src/"):
                src_path = os.path.join(BASE_DIR, parsed.path[1:])  # Remove leading /
                if os.path.exists(src_path):
                    self.send_source_file(src_path)
                else:
                    self.send_error(404)
                return
            
            # === DASHBOARD ROUTES ===
            elif parsed.path == "/api/manifest":
                self.send_json(get_manifest())
            elif parsed.path.startswith("/images/"):
                # Serve images from assets/images
                img_path = os.path.join(IMAGES_DIR, parsed.path[8:])
                if os.path.exists(img_path):
                    self.serve_file(img_path)
                else:
                    self.send_error(404)
            elif parsed.path.startswith("/audio/"):
                # Serve audio files from assets/audio
                audio_path = os.path.join(BASE_DIR, "assets", "audio", parsed.path[7:])
                if os.path.exists(audio_path):
                    self.serve_file(audio_path, content_type="audio/wav")
                else:
                    self.send_error(404)
            else:
                super().do_GET()
        except Exception as e:
            print(f"GET Error: {e}")
            try:
                self.send_error(500, str(e))
            except:
                pass
    
    def do_POST(self):
        try:
            parsed = urlparse(self.path)
            print(f"POST request: {parsed.path}")  # DEBUG
            content_len = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_len).decode('utf-8') if content_len > 0 else '{}'
            data = json.loads(body) if body else {}
            
            if parsed.path == "/api/change_status":
                result = self.change_status(data.get("path"), data.get("newStatus"))
                self.send_json(result)
            elif parsed.path == "/api/save_notes":
                result = self.save_notes(data.get("assetName"), data.get("notes"))
                self.send_json(result)
            elif parsed.path == "/api/get_notes":
                result = self.get_notes()
                self.send_json(result)
            elif parsed.path == "/api/get_prompts":
                result = self.get_prompts()
                self.send_json(result)
            elif parsed.path == "/api/missing_assets":
                result = self.get_missing_assets()
                self.send_json(result)
            elif parsed.path == "/api/get_prompt_templates":
                result = self.get_prompt_templates()
                self.send_json(result)
            elif parsed.path == "/api/save_prompt_templates":
                result = self.save_prompt_templates(data.get("content", ""))
                self.send_json(result)
            elif parsed.path == "/api/unsynced_assets":
                result = self.get_unsynced_assets()
                self.send_json(result)
            elif parsed.path == "/api/sync_asset":
                result = self.sync_asset(data.get("assetId"), data.get("path"), data.get("category"))
                self.send_json(result)
            elif parsed.path == "/api/save_prompts":
                result = self.save_prompts(data)
                self.send_json(result)
            elif parsed.path == "/api/remake":
                result = self.remake_asset(data.get("cleanPath"), data.get("notes"))
                self.send_json(result)
            elif parsed.path == "/api/get_loot":
                result = self.get_loot_data()
                self.send_json(result)
            elif parsed.path == "/api/update_loot_status":
                result = self.update_loot_status(data.get("type"), data.get("id"), data.get("status"), data.get("note"))
                self.send_json(result)
            elif parsed.path == "/api/get_category":
                result = self.get_category_data(data.get("category"))
                self.send_json(result)
            elif parsed.path == "/api/update_category_status":
                result = self.update_category_status(data.get("category"), data.get("file"), data.get("id"), data.get("status"), data.get("note"))
                self.send_json(result)
            elif parsed.path == "/api/update_consumed_status":
                result = self.update_consumed_status(data.get("category"), data.get("file"), data.get("id"), data.get("status"), data.get("note"))
                self.send_json(result)
            elif parsed.path == "/api/update_item_stat":
                result = self.update_item_stat(data.get("category"), data.get("file"), data.get("id"), data.get("statKey"), data.get("value"))
                self.send_json(result)
            elif parsed.path == "/api/update_item_weapon":
                result = self.update_item_weapon(data.get("category"), data.get("file"), data.get("id"), data.get("weapon"))
                self.send_json(result)
            elif parsed.path == "/api/get_all_categories":
                result = self.get_all_categories()
                self.send_json(result)
            elif parsed.path == "/api/sync_assets":
                # Regenerate AssetLoader.js with all clean assets
                result = regenerate_asset_loader()
                self.send_json(result)
            elif parsed.path == "/api/save_sfx_regen_queue":
                # Save SFX regeneration queue to file
                result = self.save_sfx_regen_queue(data.get("queue", []))
                self.send_json(result)
            else:
                self.send_error(404)
        except Exception as e:
            print(f"POST Error: {e}")
            try:
                self.send_json({"success": False, "error": str(e)})
            except:
                pass
    
    def change_status(self, path, new_status):
        if not path or not new_status:
            return {"success": False, "error": "Missing path or status"}
        
        full_path = os.path.join(IMAGES_DIR, path)
        if not os.path.exists(full_path):
            return {"success": False, "error": f"File not found: {path}"}
        
        dir_path = os.path.dirname(full_path)
        old_name = os.path.basename(path)
        
        # New naming convention: {name}_{approval}_{stage}.png
        # Strip all status tokens to get base name
        base = old_name
        for token in ['_approved', '_declined']:
            base = base.replace(token, '')
        
        # Determine if this is an _original or _clean file
        is_original = '_original' in base
        
        if is_original:
            # For original files: insert status token before _original
            base_no_original = base.replace('_original', '')
            ext = os.path.splitext(base_no_original)[1] or '.png'
            base_name = os.path.splitext(base_no_original)[0]
            
            if new_status == 'approved':
                new_name = f"{base_name}_approved_original{ext}"
            elif new_status == 'declined':
                new_name = f"{base_name}_declined_original{ext}"
            else:  # pending - remove all status tokens
                new_name = f"{base_name}_original{ext}"
        else:
            # For clean files, just use suffix
            ext = os.path.splitext(base)[1] or '.png'
            base_name = os.path.splitext(base.replace('_clean', ''))[0]
            new_name = f"{base_name}_{new_status}{ext}"
        
        new_path = os.path.join(dir_path, new_name)
        
        try:
            shutil.move(full_path, new_path)
            return {"success": True, "newName": new_name, "newPath": os.path.relpath(new_path, IMAGES_DIR).replace("\\", "/")}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def save_notes(self, asset_name, notes):
        notes_file = os.path.join(TOOLS_DIR, "decline_notes.json")
        existing = {}
        if os.path.exists(notes_file):
            with open(notes_file, 'r') as f:
                existing = json.load(f)
        existing[asset_name] = notes
        with open(notes_file, 'w') as f:
            json.dump(existing, f, indent=2)
        return {"success": True}
    
    def get_notes(self):
        notes_file = os.path.join(TOOLS_DIR, "decline_notes.json")
        if os.path.exists(notes_file):
            with open(notes_file, 'r') as f:
                return json.load(f)
        return {}
    
    def get_prompts(self):
        prompts_file = os.path.join(TOOLS_DIR, "asset_prompts.json")
        if os.path.exists(prompts_file):
            with open(prompts_file, 'r') as f:
                return json.load(f)
        return {}
    
    def save_prompts(self, prompts_data):
        """Save prompts to asset_prompts.json"""
        prompts_file = os.path.join(TOOLS_DIR, "asset_prompts.json")
        try:
            with open(prompts_file, 'w', encoding='utf-8') as f:
                json.dump(prompts_data, f, indent=4)
            return {"success": True, "message": "Prompts saved successfully"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_missing_assets(self):
        """Parse AssetLoader.js to find assets pointing to PH.png"""
        import re
        asset_loader_path = os.path.join(BASE_DIR, "src", "core", "AssetLoader.js")
        missing = []
        
        if os.path.exists(asset_loader_path):
            with open(asset_loader_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Find all asset entries: "asset_id": { "path": "..." }
            pattern = r'"([^"]+)":\s*\{\s*"path":\s*"([^"]+)"'
            matches = re.findall(pattern, content)
            
            for asset_id, path in matches:
                if 'PH.png' in path:
                    # Suggest expected filename
                    expected = asset_id.replace('_', '_') + '_clean.png'
                    missing.append({
                        "id": asset_id,
                        "currentPath": path,
                        "expectedFile": expected
                    })
        
        return {"missing": missing, "count": len(missing)}
    
    def get_prompt_templates(self):
        """Get the contents of documents/asset_prompts.md"""
        templates_file = os.path.join(BASE_DIR, "documents", "asset_prompts.md")
        if os.path.exists(templates_file):
            with open(templates_file, 'r', encoding='utf-8') as f:
                return {"success": True, "content": f.read()}
        return {"success": False, "error": "Templates file not found", "content": ""}
    
    def save_prompt_templates(self, content):
        """Save content to documents/asset_prompts.md"""
        templates_file = os.path.join(BASE_DIR, "documents", "asset_prompts.md")
        try:
            with open(templates_file, 'w', encoding='utf-8') as f:
                f.write(content)
            return {"success": True, "message": "Templates saved successfully"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_unsynced_assets(self):
        """Find clean assets that are not registered in AssetLoader.js"""
        import re
        asset_loader_path = os.path.join(BASE_DIR, "src", "core", "AssetLoader.js")
        
        # Get all paths currently in AssetLoader.js
        registered_paths = set()
        if os.path.exists(asset_loader_path):
            with open(asset_loader_path, 'r', encoding='utf-8') as f:
                content = f.read()
            pattern = r'"path":\s*"([^"]+)"'
            registered_paths = set(re.findall(pattern, content))
        
        # Find all clean files
        unsynced = []
        for folder in ["buildings", "characters", "dinosaurs", "drops", "items", "resources", "tools", "ui"]:
            folder_path = os.path.join(IMAGES_DIR, folder)
            if os.path.exists(folder_path):
                for file in os.listdir(folder_path):
                    if file.endswith("_clean.png"):
                        rel_path = f"images/{folder}/{file}"
                        if rel_path not in registered_paths:
                            # Generate suggested asset ID
                            base_name = file.replace("_clean.png", "")
                            # Determine category prefix
                            if folder == "ui":
                                suggested_id = f"ui_{base_name}"
                            elif folder == "dinosaurs":
                                suggested_id = f"dino_{base_name.replace('dino_', '')}"
                            elif folder == "resources":
                                suggested_id = f"world_{base_name.replace('res_', '')}"
                            else:
                                suggested_id = base_name
                            
                            unsynced.append({
                                "file": file,
                                "path": rel_path,
                                "folder": folder,
                                "suggestedId": suggested_id
                            })
        
        return {"unsynced": unsynced, "count": len(unsynced)}
    
    def sync_asset(self, asset_id, path, category):
        """Add a new entry to AssetLoader.js"""
        if not asset_id or not path:
            return {"success": False, "error": "Missing asset ID or path"}
        
        asset_loader_path = os.path.join(BASE_DIR, "src", "core", "AssetLoader.js")
        if not os.path.exists(asset_loader_path):
            return {"success": False, "error": "AssetLoader.js not found"}
        
        with open(asset_loader_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find the ASSETS object and add the new entry
        # Look for the last entry before the closing brace
        import re
        
        # Find where to insert (before the closing brace of ASSETS)
        # Pattern: find the last }; of the ASSETS object
        new_entry = f'        "{asset_id}": {{ "path": "{path}" }},\n'
        
        # Insert before the "// End assets" comment or before the }; 
        if "// End assets" in content:
            content = content.replace("// End assets", new_entry + "        // End assets")
        else:
            # Try to insert before the closing of ASSETS = {
            # Find pattern like }; at the end of ASSETS block
            pattern = r'(    static ASSETS = \{[^}]+)(    \};)'
            match = re.search(pattern, content, re.DOTALL)
            if match:
                content = content.replace(match.group(0), match.group(1) + new_entry + match.group(2))
            else:
                return {"success": False, "error": "Could not find insertion point in AssetLoader.js"}
        
        with open(asset_loader_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return {"success": True, "message": f"Added {asset_id} to AssetLoader.js"}
    
    def remake_asset(self, clean_path, notes):
        """Mark a clean asset for remake by declining its original version"""
        if not clean_path:
            return {"success": False, "error": "Missing clean path"}
        
        # Find the corresponding original file
        # Priority: _final_original > _approved_original > _original
        original_path = clean_path.replace('_clean.png', '_original.png')
        full_original = os.path.join(IMAGES_DIR, original_path)
        
        # Check in order: final, approved, original
        if not os.path.exists(full_original):
            # Check for final_original (assets that were cleaned)
            final_path = clean_path.replace('_clean.png', '_final_original.png')
            full_final = os.path.join(IMAGES_DIR, final_path)
            if os.path.exists(full_final):
                full_original = full_final
                original_path = final_path
            else:
                # Check for approved_original (legacy, hasn't been cleaned yet)
                approved_path = clean_path.replace('_clean.png', '_approved_original.png')
                full_approved = os.path.join(IMAGES_DIR, approved_path)
                if os.path.exists(full_approved):
                    full_original = full_approved
                    original_path = approved_path
                else:
                    return {"success": False, "error": f"Original file not found: {original_path}, {final_path}, or {approved_path}"}
        
        # Rename original to declined_original
        dir_path = os.path.dirname(full_original)
        old_name = os.path.basename(full_original)
        
        # Build new declined name (remove any existing status tag)
        if '_final_original.png' in old_name:
            new_name = old_name.replace('_final_original.png', '_declined_original.png')
        elif '_approved_original.png' in old_name:
            new_name = old_name.replace('_approved_original.png', '_declined_original.png')
        else:
            new_name = old_name.replace('_original.png', '_declined_original.png')
        new_path = os.path.join(dir_path, new_name)
        
        # Rename the file
        shutil.move(full_original, new_path)
        
        # Also delete the clean file so the game uses PH.png
        full_clean = os.path.join(IMAGES_DIR, clean_path)
        if os.path.exists(full_clean):
            os.remove(full_clean)
        
        # Save notes if provided
        if notes:
            notes_file = os.path.join(TOOLS_DIR, "decline_notes.json")
            existing = {}
            if os.path.exists(notes_file):
                with open(notes_file, 'r') as f:
                    existing = json.load(f)
            existing[new_name] = notes
            with open(notes_file, 'w') as f:
                json.dump(existing, f, indent=4)
        
        return {"success": True, "message": f"Marked for remake: {old_name} -> {new_name}"}
    
    def get_loot_data(self):
        """Get loot data by merging all files from loot/ folder"""
        loot_dir = os.path.join(TOOLS_DIR, "loot")
        if not os.path.exists(loot_dir):
            # Fallback to old single file
            loot_file = os.path.join(TOOLS_DIR, "loot_data.json")
            if os.path.exists(loot_file):
                with open(loot_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return {"error": "loot folder not found"}
        
        # Merge all files from loot folder
        result = {"resources": [], "items": [], "equipment": [], "lootTables": [], "sets": []}
        
        for filename in os.listdir(loot_dir):
            if not filename.endswith('.json'):
                continue
            filepath = os.path.join(loot_dir, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if filename == '_config.json':
                result.update(data)  # Merge config (defaults, rarityColors, etc.)
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
    
    def update_loot_status(self, item_type, item_id, new_status, note=None):
        """Update the status of a loot item (approved/declined/pending)"""
        if not item_type or not item_id or not new_status:
            return {"success": False, "error": "Missing type, id, or status"}
        
        loot_dir = os.path.join(TOOLS_DIR, "loot")
        if not os.path.exists(loot_dir):
            return {"success": False, "error": "loot folder not found"}
        
        # Find which file contains this item
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
            with open(filepath, 'r', encoding='utf-8') as f:
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
            return {"success": False, "error": f"Item not found: {item_type}/{item_id}"}
        
        # Update status in the target file
        target_data[target_index]["status"] = new_status
        with open(target_file, 'w', encoding='utf-8') as f:
            json.dump(target_data, f, indent=4)
        
        # Save decline note to config if provided
        if note and new_status == 'declined':
            config_file = os.path.join(loot_dir, "_config.json")
            with open(config_file, 'r', encoding='utf-8') as f:
                config = json.load(f)
            if "declineNotes" not in config:
                config["declineNotes"] = {}
            config["declineNotes"][item_id] = note
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=4)
        
        return {"success": True, "message": f"Updated {item_type}/{item_id} to {new_status}"}
    
    def get_all_categories(self):
        """Get summary of all available asset categories"""
        categories = []
        for cat in ['loot', 'npcs', 'props', 'buildings', 'ui', 'vfx', 'audio']:
            cat_dir = os.path.join(TOOLS_DIR, cat)
            if os.path.exists(cat_dir):
                files = [f for f in os.listdir(cat_dir) if f.endswith('.json') and not f.startswith('_')]
                config_file = os.path.join(cat_dir, '_config.json')
                config = {}
                if os.path.exists(config_file):
                    with open(config_file, 'r', encoding='utf-8') as f:
                        config = json.load(f)
                categories.append({
                    'name': cat,
                    'files': files,
                    'description': config.get('description', ''),
                    'fileCount': len(files)
                })
        return {'categories': categories}
    
    def get_category_data(self, category):
        """Get all data from a category folder (npcs, props, buildings, ui, vfx, audio)"""
        if not category:
            return {"error": "Missing category parameter"}
        
        cat_dir = os.path.join(TOOLS_DIR, category)
        if not os.path.exists(cat_dir):
            return {"error": f"Category folder not found: {category}"}
        
        result = {'_config': {}, 'files': {}, 'asset_queue': {}}
        
        for filename in os.listdir(cat_dir):
            if not filename.endswith('.json'):
                continue
            filepath = os.path.join(cat_dir, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if filename == '_config.json':
                result['_config'] = data
            elif filename == 'asset_queue.json':
                result['asset_queue'] = data
            else:
                result['files'][filename.replace('.json', '')] = data
        
        return result
    
    def update_category_status(self, category, filename, item_id, new_status, note=None):
        """Update the status of an item in any category"""
        if not category or not filename or not item_id or not new_status:
            return {"success": False, "error": "Missing required parameters"}
        
        cat_dir = os.path.join(TOOLS_DIR, category)
        filepath = os.path.join(cat_dir, f"{filename}.json")
        
        if not os.path.exists(filepath):
            return {"success": False, "error": f"File not found: {filepath}"}
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Find and update the item
        found = False
        for item in data:
            if item.get('id') == item_id:
                item['status'] = new_status
                if note and new_status == 'declined':
                    item['declineNote'] = note
                found = True
                break
        
        if not found:
            return {"success": False, "error": f"Item not found: {item_id}"}
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)
        
        return {"success": True, "message": f"Updated {category}/{filename}/{item_id} to {new_status}"}
    
    def update_consumed_status(self, category, filename, item_id, new_status, note=None):
        """Update the consumed version status of an item (separate from main status)"""
        print(f"DEBUG update_consumed_status: category={category}, filename={filename}, item_id={item_id}, status={new_status}, note={note}")
        if not category or not filename or not item_id or not new_status:
            return {"success": False, "error": f"Missing required parameters: category={category}, filename={filename}, item_id={item_id}, status={new_status}"}
        
        cat_dir = os.path.join(TOOLS_DIR, category)
        filepath = os.path.join(cat_dir, f"{filename}.json")
        
        if not os.path.exists(filepath):
            return {"success": False, "error": f"File not found: {filepath}"}
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Find and update the item's consumed status
        found = False
        for item in data:
            if item.get('id') == item_id:
                item['consumedStatus'] = new_status
                if note and new_status == 'declined':
                    item['consumedDeclineNote'] = note
                found = True
                break
        
        if not found:
            return {"success": False, "error": f"Item not found: {item_id}"}
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)
        
        return {"success": True, "message": f"Updated consumed status for {category}/{filename}/{item_id} to {new_status}"}
    
    def update_item_stat(self, category, filename, item_id, stat_key, value):
        """Update a specific stat of an item in any category"""
        if not category or not filename or not item_id or not stat_key:
            return {"success": False, "error": "Missing required parameters"}
        
        cat_dir = os.path.join(TOOLS_DIR, category)
        filepath = os.path.join(cat_dir, f"{filename}.json")
        
        if not os.path.exists(filepath):
            return {"success": False, "error": f"File not found: {filepath}"}
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Find and update the item's stat
        found = False
        for item in data:
            if item.get('id') == item_id:
                if 'stats' not in item:
                    item['stats'] = {}
                item['stats'][stat_key] = value
                found = True
                print(f"Updated {item_id}.stats.{stat_key} = {value}")
                break
        
        if not found:
            return {"success": False, "error": f"Item not found: {item_id}"}
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)
        
        return {"success": True, "message": f"Updated {category}/{filename}/{item_id}.stats.{stat_key} = {value}"}
    
    def update_item_weapon(self, category, filename, item_id, weapon):
        """Update the weapon type and sourceDescription for an enemy"""
        import re
        
        if not category or not filename or not item_id:
            return {"success": False, "error": "Missing required parameters"}
        
        cat_dir = os.path.join(TOOLS_DIR, category)
        filepath = os.path.join(cat_dir, f"{filename}.json")
        
        if not os.path.exists(filepath):
            return {"success": False, "error": f"File not found: {filepath}"}
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Find and update the item
        found = False
        for item in data:
            if item.get('id') == item_id:
                # Set the weaponType field
                item['weaponType'] = weapon
                
                # Update sourceDescription to replace weapon references
                if item.get('sourceDescription') and weapon:
                    old_desc = item['sourceDescription']
                    weapon_display = weapon.replace('_', ' ')
                    
                    # List of known weapon names to match
                    weapons = ['sword', 'axe', 'mace', 'lance', 'halberd', 'billhook', 'trench club', 
                               'bayonet', 'spear', 'greatsword', 'warhammer', 'flail', 'pike', 'glaive',
                               'dual blades', 'rifle', 'pistol', 'submachine gun', 'machine gun', 'crossbow',
                               'war horn and mace', 'war horn']
                    weapon_pattern = '|'.join(re.escape(w) for w in weapons)
                    
                    # Try different patterns to find and replace weapons
                    new_desc = old_desc
                    replaced = False
                    
                    # Pattern 1: "wielding a/an/dual WEAPON"
                    pattern1 = rf'(wielding (?:a |an |dual )?)({weapon_pattern})'
                    if re.search(pattern1, new_desc, re.IGNORECASE):
                        new_desc = re.sub(pattern1, rf'\1{weapon_display}', new_desc, count=1, flags=re.IGNORECASE)
                        replaced = True
                    
                    # Pattern 2: ", WEAPON" at end or ", WEAPON,"
                    if not replaced:
                        pattern2 = rf',\s*({weapon_pattern})(\s*,|\s*$)'
                        if re.search(pattern2, new_desc, re.IGNORECASE):
                            new_desc = re.sub(pattern2, f', {weapon_display}\\2', new_desc, count=1, flags=re.IGNORECASE)
                            replaced = True
                    
                    # Pattern 3: standalone weapon word
                    if not replaced:
                        for w in weapons:
                            if w.lower() in new_desc.lower():
                                new_desc = re.sub(rf'\b{re.escape(w)}\b', weapon_display, new_desc, count=1, flags=re.IGNORECASE)
                                replaced = True
                                break
                    
                    if replaced and new_desc != old_desc:
                        item['sourceDescription'] = new_desc
                        print(f"Updated sourceDescription: '{old_desc}' -> '{new_desc}'")
                
                found = True
                print(f"Updated {item_id}.weaponType = {weapon}")
                break
        
        if not found:
            return {"success": False, "error": f"Item not found: {item_id}"}
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)
        
        return {"success": True, "message": f"Updated {category}/{filename}/{item_id} weapon to {weapon}"}
    
    def save_sfx_regen_queue(self, queue):
        """Save SFX regeneration queue to file"""
        from datetime import datetime
        queue_file = os.path.join(TOOLS_DIR, "sfx_regeneration_queue.json")
        try:
            data = {
                "queue": queue,
                "lastUpdated": datetime.now().isoformat(),
                "note": "This file tracks SFX marked for regeneration from the dashboard. Use /sound-regenerate workflow to process."
            }
            with open(queue_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            return {"success": True, "message": f"Saved {len(queue)} items to SFX regeneration queue"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def send_json(self, data):
        content = json.dumps(data).encode('utf-8')
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(content))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(content)
    
    def send_file(self, path):
        with open(path, 'rb') as f:
            content = f.read()
        ext = os.path.splitext(path)[1].lower()
        mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg"}.get(ext[1:], "application/octet-stream")
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", len(content))
        self.end_headers()
        self.wfile.write(content)
    
    def send_source_file(self, path):
        with open(path, 'rb') as f:
            content = f.read()
        ext = os.path.splitext(path)[1].lower()
        mime = {".js": "application/javascript", ".css": "text/css"}.get(ext, "text/plain")
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", len(content))
        self.end_headers()
        self.wfile.write(content)
    
    def log_message(self, format, *args):
        pass  # Suppress logging

class RobustTCPServer(socketserver.TCPServer):
    """TCP Server that doesn't crash on individual request errors"""
    allow_reuse_address = True
    
    def handle_error(self, request, client_address):
        """Handle errors without crashing the server"""
        print(f"Request error from {client_address}: {sys.exc_info()[1]}")

if __name__ == "__main__":
    print(f"Asset Dashboard Server")
    print(f"======================")
    print(f"Open: http://localhost:{PORT}/asset_dashboard_server.html")
    print(f"Press Ctrl+C to stop\n")
    
    while True:
        try:
            with RobustTCPServer(("", PORT), DashboardHandler) as httpd:
                print(f"Server running on port {PORT}...")
                httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped by user.")
            break
        except OSError as e:
            if "Address already in use" in str(e) or "10048" in str(e):
                print(f"Port {PORT} in use, waiting...")
                import time
                time.sleep(2)
            else:
                print(f"Server error: {e}")
                print("Restarting in 2 seconds...")
                import time
                time.sleep(2)
        except Exception as e:
            print(f"Unexpected error: {e}")
            print("Restarting in 2 seconds...")
            import time
            time.sleep(2)

