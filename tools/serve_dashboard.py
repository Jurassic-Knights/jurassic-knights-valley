"""
Asset Dashboard Server (Modular)
Run this to serve the dashboard with full filesystem access.
Port: 5174

Handler modules in dashboard_api/:
- asset_handlers.py: Asset sync, approval
- entity_handlers.py: Entity JSON sync
- category_handlers.py: Category CRUD
- loot_handlers.py: Loot tables

Auto-reloads Python modules on each POST request (dev mode).
"""
import os
import json
import http.server
import socketserver
import importlib
from urllib.parse import urlparse
from datetime import datetime

# Import modules (not functions) for reload support
from dashboard_api import utils, asset_handlers, entity_handlers, category_handlers, loot_handlers

PORT = 8000
DEV_MODE = True  # Set to False for production


def reload_handlers():
    """Reload all handler modules to pick up code changes"""
    if not DEV_MODE:
        return
    importlib.reload(utils)
    importlib.reload(asset_handlers)
    importlib.reload(entity_handlers)
    importlib.reload(category_handlers)
    importlib.reload(loot_handlers)


# Get initial references
BASE_DIR = utils.BASE_DIR
IMAGES_DIR = utils.IMAGES_DIR
TOOLS_DIR = utils.TOOLS_DIR


class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=utils.TOOLS_DIR, **kwargs)
    
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
    
    def do_GET(self):
        try:
            parsed = urlparse(self.path)
            print(f"GET: {parsed.path}")
            
            # Root redirect - serve game at root
            if parsed.path in ["/", ""]:
                self.send_response(302)
                self.send_header('Location', '/game/')
                self.end_headers()
                return
            
            # Dashboard routes
            if parsed.path in ["/dashboard", "/dashboard/"]:
                self.serve_file(os.path.join(TOOLS_DIR, "dashboard", "index.html"), "text/html")
                return
            
            if parsed.path.startswith("/dashboard/"):
                rel_path = parsed.path[11:]
                self.serve_file(os.path.join(TOOLS_DIR, "dashboard", rel_path))
                return
            
            # Game routes
            if parsed.path in ["/game", "/game/"]:
                self.serve_file(os.path.join(BASE_DIR, "index.html"), "text/html")
                return
            
            # Game static assets (relative paths from /game/index.html)
            if parsed.path.startswith("/game/src/"):
                self.serve_file(os.path.join(BASE_DIR, parsed.path[6:]))  # Remove /game prefix
                return
            
            if parsed.path.startswith("/game/assets/"):
                self.serve_file(os.path.join(BASE_DIR, parsed.path[6:]))  # Remove /game prefix
                return
            
            if parsed.path.startswith("/game/css/"):
                self.serve_file(os.path.join(BASE_DIR, parsed.path[6:]))  # Remove /game prefix
                return
            
            # Asset routes
            if parsed.path.startswith("/assets/"):
                self.serve_file(os.path.join(BASE_DIR, parsed.path[1:]))
                return
            
            if parsed.path.startswith("/src/"):
                self.serve_file(os.path.join(BASE_DIR, parsed.path[1:]))
                return
            
            if parsed.path.startswith("/images/"):
                self.serve_file(os.path.join(IMAGES_DIR, parsed.path[8:]))
                return
            
            if parsed.path.startswith("/audio/"):
                self.serve_file(os.path.join(BASE_DIR, "assets", "audio", parsed.path[7:]))
                return
            
            # API: GET endpoints
            if parsed.path == "/api/manifest":
                self.send_json(utils.get_manifest())
                return
            
            if parsed.path == "/api/get_sfx_queue":
                queue_file = os.path.join(TOOLS_DIR, "sfx_regeneration_queue.json")
                if os.path.exists(queue_file):
                    with open(queue_file, 'r', encoding='utf-8') as f:
                        self.send_json(json.load(f))
                else:
                    self.send_json({"queue": [], "lastUpdated": None})
                return
            
            super().do_GET()
            
        except Exception as e:
            print(f"GET Error: {e}")
            self.send_error(500, str(e))
    
    def do_POST(self):
        try:
            # Reload handler modules to pick up code changes
            reload_handlers()
            
            parsed = urlparse(self.path)
            print(f"POST: {parsed.path}")
            content_len = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_len).decode('utf-8') if content_len > 0 else '{}'
            data = json.loads(body) if body else {}
            
            # Route to handlers (use module prefix for reloaded functions)
            if parsed.path == "/api/change_status":
                result = asset_handlers.change_status(data.get("path"), data.get("newStatus"))
            
            elif parsed.path == "/api/get_category" or parsed.path.startswith("/api/get_category?"):
                category = data.get("category")
                result = category_handlers.get_category_data(category)
            
            elif parsed.path == "/api/update_category_status":
                result = category_handlers.update_category_status(
                    data.get("category"), data.get("file"), 
                    data.get("id"), data.get("status"), data.get("note")
                )
            
            elif parsed.path == "/api/update_consumed_status":
                result = category_handlers.update_consumed_status(
                    data.get("category"), data.get("file"),
                    data.get("id"), data.get("status"), data.get("note")
                )
            
            elif parsed.path == "/api/update_item_stat":
                result = category_handlers.update_item_stat(
                    data.get("category"), data.get("file"),
                    data.get("id"), data.get("statKey"), data.get("value")
                )
            
            elif parsed.path == "/api/update_item_weapon":
                result = category_handlers.update_item_weapon(
                    data.get("category"), data.get("file"),
                    data.get("id"), data.get("weapon")
                )
            
            elif parsed.path == "/api/update_item_field":
                result = category_handlers.update_item_field(
                    data.get("category"), data.get("file"),
                    data.get("id"), data.get("field"), data.get("value")
                )
            
            elif parsed.path == "/api/get_all_categories":
                result = category_handlers.get_all_categories()
            
            elif parsed.path == "/api/get_loot":
                result = loot_handlers.get_loot_data()
            
            elif parsed.path == "/api/update_loot_status":
                result = loot_handlers.update_loot_status(
                    data.get("type"), data.get("id"),
                    data.get("status"), data.get("note")
                )
            
            elif parsed.path == "/api/sync_assets":
                result = asset_handlers.regenerate_asset_loader()
            
            elif parsed.path == "/api/sync_entities":
                result = entity_handlers.sync_all_entities()
            
            elif parsed.path == "/api/save_sfx_regen_queue":
                result = self._save_sfx_queue(data.get("queue", []))
            
            elif parsed.path == "/api/save_notes":
                result = self._save_notes(data.get("assetName"), data.get("notes"))
            
            elif parsed.path == "/api/get_notes":
                result = self._get_notes()
            
            elif parsed.path == "/api/get_prompts":
                result = self._get_prompts()
            
            elif parsed.path == "/api/save_prompts":
                result = self._save_prompts(data)
            
            elif parsed.path == "/api/get_prompt_templates":
                result = self._get_prompt_templates()
            
            elif parsed.path == "/api/save_prompt_templates":
                result = self._save_prompt_templates(data.get("content", ""))
            
            else:
                self.send_error(404)
                return
            
            self.send_json(result)
            
        except Exception as e:
            print(f"POST Error: {e}")
            import traceback
            traceback.print_exc()
            self.send_json({"success": False, "error": str(e)})
    
    # Helper methods kept in main handler for simplicity
    def _save_sfx_queue(self, queue):
        queue_file = os.path.join(TOOLS_DIR, "sfx_regeneration_queue.json")
        data = {
            "queue": queue,
            "lastUpdated": datetime.now().isoformat(),
            "note": "SFX marked for regeneration"
        }
        with open(queue_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        return {"success": True, "message": f"Saved {len(queue)} items"}
    
    def _save_notes(self, asset_name, notes):
        notes_file = os.path.join(TOOLS_DIR, "decline_notes.json")
        existing = {}
        if os.path.exists(notes_file):
            with open(notes_file, 'r') as f:
                existing = json.load(f)
        existing[asset_name] = notes
        with open(notes_file, 'w') as f:
            json.dump(existing, f, indent=2)
        return {"success": True}
    
    def _get_notes(self):
        notes_file = os.path.join(TOOLS_DIR, "decline_notes.json")
        if os.path.exists(notes_file):
            with open(notes_file, 'r') as f:
                return json.load(f)
        return {}
    
    def _get_prompts(self):
        prompts_file = os.path.join(TOOLS_DIR, "asset_prompts.json")
        if os.path.exists(prompts_file):
            with open(prompts_file, 'r') as f:
                return json.load(f)
        return {}
    
    def _save_prompts(self, prompts_data):
        prompts_file = os.path.join(TOOLS_DIR, "asset_prompts.json")
        with open(prompts_file, 'w', encoding='utf-8') as f:
            json.dump(prompts_data, f, indent=4)
        return {"success": True}
    
    def _get_prompt_templates(self):
        templates_file = os.path.join(BASE_DIR, "documents", "asset_prompts.md")
        if os.path.exists(templates_file):
            with open(templates_file, 'r', encoding='utf-8') as f:
                return {"success": True, "content": f.read()}
        return {"success": False, "error": "Not found", "content": ""}
    
    def _save_prompt_templates(self, content):
        templates_file = os.path.join(BASE_DIR, "documents", "asset_prompts.md")
        with open(templates_file, 'w', encoding='utf-8') as f:
            f.write(content)
        return {"success": True}
    
    def log_message(self, format, *args):
        pass  # Quiet logging


if __name__ == "__main__":
    print(f"Starting Asset Dashboard on port {PORT}...")
    print(f"Dashboard: http://localhost:{PORT}/dashboard/")
    print(f"Game: http://localhost:{PORT}/game/")
    
    # Use ThreadingHTTPServer for faster parallel file serving
    class ThreadedServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
        allow_reuse_address = True
        daemon_threads = True
    
    with ThreadedServer(("", PORT), DashboardHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down...")
