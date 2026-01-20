#!/usr/bin/env python3
"""
Auto-Clean Watcher
Monitors for newly approved assets and automatically triggers Photoshop cleaning.
"""

import os
import sys
import time
import subprocess
from pathlib import Path

# Add scripts directory to path
SCRIPT_DIR = Path(__file__).parent
BASE_DIR = SCRIPT_DIR.parent
IMAGES_DIR = BASE_DIR / "assets" / "images"
PHOTOSHOP_SCRIPT = SCRIPT_DIR / "photoshop_remove_bg.py"

# Folders to watch
WATCH_FOLDERS = [
    "buildings",
    "characters", 
    "dinosaurs",
    "drops",
    "items",
    "resources",
    "tools",
    "ui"
]

def get_approved_without_clean():
    """Find all approved assets that don't have a clean version yet."""
    pending_clean = []
    
    for folder in WATCH_FOLDERS:
        folder_path = IMAGES_DIR / folder
        if not folder_path.exists():
            continue
            
        for file in folder_path.glob("*_approved_original.png"):
            clean_name = file.name.replace("_approved_original.png", "_clean.png")
            clean_path = folder_path / clean_name
            if not clean_path.exists():
                pending_clean.append({
                    "folder": folder,
                    "file": file.name,
                    "path": str(file)
                })
    
    return pending_clean

def run_clean_for_folder(folder):
    """Run photoshop cleaning for a specific folder."""
    folder_path = IMAGES_DIR / folder
    print(f"  [CLEAN] Processing {folder}...")
    result = subprocess.run(
        [sys.executable, str(PHOTOSHOP_SCRIPT), str(folder_path)],
        capture_output=True,
        text=True
    )
    if result.returncode == 0:
        print(f"  [CLEAN] {folder} complete")
    else:
        print(f"  [ERROR] {folder} failed: {result.stderr}")
    return result.returncode == 0

def main():
    """Main watcher loop."""
    print("=" * 50)
    print("AUTO-CLEAN WATCHER")
    print("=" * 50)
    print(f"Watching: {IMAGES_DIR}")
    print("Press Ctrl+C to stop")
    print("-" * 50)
    
    processed = set()
    
    try:
        while True:
            pending = get_approved_without_clean()
            
            # Filter out already processed in this session
            new_pending = [p for p in pending if p["path"] not in processed]
            
            if new_pending:
                print(f"\n[{time.strftime('%H:%M:%S')}] Found {len(new_pending)} new assets to clean:")
                
                # Group by folder
                folders_to_clean = set()
                for p in new_pending:
                    print(f"  - {p['folder']}/{p['file']}")
                    folders_to_clean.add(p["folder"])
                    processed.add(p["path"])
                
                # Clean each folder
                for folder in folders_to_clean:
                    run_clean_for_folder(folder)
                
                print(f"[{time.strftime('%H:%M:%S')}] Cleaning complete. Watching for changes...\n")
            
            # Wait before checking again
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("\n\nWatcher stopped.")

if __name__ == "__main__":
    main()
