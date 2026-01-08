"""
Asset Manifest Generator
Scans assets/images and generates a JSON manifest for the dashboard.
Run this script whenever assets change.
"""
import os
import json
import glob

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES_DIR = os.path.join(BASE_DIR, "assets", "images")
OUTPUT_FILE = os.path.join(BASE_DIR, "tools", "asset_manifest.js")

def get_status(filename):
    """Determine asset status from filename suffix."""
    if "_clean" in filename:
        return "clean"
    if "_final" in filename:
        return "final"
    if "_approved" in filename:
        return "approved"
    if "_declined" in filename:
        return "declined"
    if "_original" in filename:
        return "pending"
    return "unknown"

def scan_assets():
    """Scan all images and build manifest."""
    assets = []
    
    for root, dirs, files in os.walk(IMAGES_DIR):
        # Get relative category path
        rel_path = os.path.relpath(root, IMAGES_DIR)
        category = rel_path.split(os.sep)[0] if rel_path != "." else "root"
        
        for file in files:
            if not file.lower().endswith(('.png', '.jpg', '.jpeg')):
                continue
            if file.startswith('.'):
                continue
                
            full_path = os.path.join(root, file)
            rel_file_path = os.path.relpath(full_path, IMAGES_DIR)
            
            assets.append({
                "name": file,
                "path": rel_file_path.replace("\\", "/"),
                "category": category,
                "status": get_status(file)
            })
    
    return assets

def main():
    print(f"Scanning: {IMAGES_DIR}")
    assets = scan_assets()
    
    # Count by status
    counts = {}
    for a in assets:
        counts[a["status"]] = counts.get(a["status"], 0) + 1
    
    manifest = {
        "generated": True,
        "basePath": "../assets/images/",
        "assets": assets,
        "counts": counts
    }
    
    # Write as JavaScript module (avoids CORS)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("// Auto-generated asset manifest\n")
        f.write("window.ASSET_MANIFEST = ")
        json.dump(manifest, f, indent=2)
        f.write(";\n")
    
    print(f"Generated manifest with {len(assets)} assets")
    print(f"Counts: {counts}")
    print(f"Output: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
