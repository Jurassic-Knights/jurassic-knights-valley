"""Delete all .json files from src/entities/ (except manifest.json)"""
import os
from pathlib import Path

ENTITIES_DIR = Path(__file__).parent.parent / "src" / "entities"

def cleanup():
    count = 0
    for json_file in ENTITIES_DIR.rglob("*.json"):
        if json_file.name == "manifest.json":
            continue
        try:
            json_file.unlink()
            count += 1
        except Exception as e:
            print(f"Error deleting {json_file}: {e}")
    
    print(f"Deleted {count} .json files")

if __name__ == "__main__":
    cleanup()
