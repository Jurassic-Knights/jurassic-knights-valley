"""
ES6 Module Migration Script

This script adds ES6 exports to all JS files that use the window.X = X pattern.
It finds the pattern and adds 'export { X };' after it.
"""

import os
import re
from pathlib import Path

SRC_DIR = Path(__file__).parent.parent / "src"

# Pattern to find: window.ClassName = ClassName; or window.ClassName = new ClassName();
WINDOW_PATTERN = re.compile(r"window\.(\w+)\s*=\s*(?:new\s+)?(\w+)(?:\(\))?;?\s*$", re.MULTILINE)

# Files already migrated
MIGRATED = {"Logger.js", "Registry.js", "EventBus.js"}

def add_export_to_file(file_path: Path) -> bool:
    """Add ES6 export to a file if it has window.X pattern and no export yet."""
    
    content = file_path.read_text(encoding="utf-8")
    
    # Skip if already has export
    if "export {" in content or "export default" in content:
        return False
    
    # Find window.X = X patterns
    matches = WINDOW_PATTERN.findall(content)
    if not matches:
        return False
    
    # Get unique class names that are exported to window
    exports = set()
    for window_name, class_name in matches:
        # Only export if window.X and X are the same (or window.X = new X())
        if window_name == class_name or class_name.endswith(window_name):
            exports.add(window_name)
    
    if not exports:
        return False
    
    # Add export statement at end of file
    export_line = f"\n// ES6 Module Export\nexport {{ {', '.join(sorted(exports))} }};\n"
    
    # Find last non-empty line and add export after
    content = content.rstrip() + "\n" + export_line
    
    file_path.write_text(content, encoding="utf-8")
    return True

def migrate_directory(directory: Path, stats: dict):
    """Recursively migrate all JS files in directory."""
    
    for file_path in directory.rglob("*.js"):
        if file_path.name in MIGRATED:
            continue
        
        try:
            if add_export_to_file(file_path):
                stats["migrated"].append(file_path.name)
                print(f"[OK] {file_path.relative_to(SRC_DIR)}")
            else:
                stats["skipped"].append(file_path.name)
        except Exception as e:
            stats["errors"].append((file_path.name, str(e)))
            print(f"[ERR] {file_path.name}: {e}")

def main():
    stats = {"migrated": [], "skipped": [], "errors": []}
    
    print(f"Migrating files in {SRC_DIR}...")
    print("-" * 50)
    
    migrate_directory(SRC_DIR, stats)
    
    print("-" * 50)
    print(f"Migrated: {len(stats['migrated'])} files")
    print(f"Skipped: {len(stats['skipped'])} files (no window.X pattern or already has export)")
    print(f"Errors: {len(stats['errors'])} files")
    
    if stats["errors"]:
        print("\nErrors:")
        for name, error in stats["errors"]:
            print(f"  {name}: {error}")

if __name__ == "__main__":
    main()
