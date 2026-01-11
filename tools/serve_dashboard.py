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

class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=TOOLS_DIR, **kwargs)
    
    def do_GET(self):
        try:
            parsed = urlparse(self.path)
            
            # Serve dashboard as default page
            if parsed.path == "/" or parsed.path == "":
                self.send_response(302)
                self.send_header('Location', '/asset_dashboard_server.html')
                self.end_headers()
                return
            elif parsed.path == "/api/manifest":
                self.send_json(get_manifest())
            elif parsed.path.startswith("/images/"):
                # Serve images from assets/images
                img_path = os.path.join(IMAGES_DIR, parsed.path[8:])
                if os.path.exists(img_path):
                    self.send_file(img_path)
                else:
                    self.send_error(404)
            elif parsed.path.startswith("/src/"):
                # Serve source files (for ProceduralSFX.js, etc)
                src_path = os.path.join(BASE_DIR, parsed.path[1:])  # Remove leading /
                if os.path.exists(src_path):
                    self.send_source_file(src_path)
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

