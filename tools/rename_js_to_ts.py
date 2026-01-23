"""
Rename all .js files to .ts in src/ directory
Does NOT modify file contents - just renames
"""

import os
from pathlib import Path

SRC_DIR = Path(__file__).parent.parent / "src"

def rename_js_to_ts():
    count = 0
    errors = []
    
    for js_file in SRC_DIR.rglob("*.js"):
        ts_file = js_file.with_suffix(".ts")
        
        try:
            js_file.rename(ts_file)
            count += 1
            print(f"[OK] {js_file.relative_to(SRC_DIR)} -> .ts")
        except Exception as e:
            errors.append(f"{js_file}: {e}")
    
    print(f"\nRenamed {count} files")
    if errors:
        print(f"Errors: {len(errors)}")
        for err in errors[:10]:
            print(f"  {err}")

if __name__ == "__main__":
    rename_js_to_ts()
