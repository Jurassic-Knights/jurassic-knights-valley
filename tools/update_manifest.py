#!/usr/bin/env python3
"""Regenerate manifest.json with all entity files."""
import os
import json
from pathlib import Path

BASE = Path(__file__).parent.parent / "src" / "entities"
MANIFEST = BASE / "manifest.json"

def get_entities(folder):
    """Get all entity IDs from a folder."""
    path = BASE / folder
    if not path.exists():
        return []
    return sorted([f.stem for f in path.glob("*.json") if not f.stem.startswith("_")])

# Load existing manifest
manifest = json.loads(MANIFEST.read_text(encoding="utf-8-sig"))

# Update entities
manifest["enemies"] = get_entities("enemies")
manifest["bosses"] = get_entities("bosses")

# Save
MANIFEST.write_text(json.dumps(manifest, indent=4), encoding="utf-8")

print(f"Updated manifest.json:")
print(f"  Enemies: {len(manifest['enemies'])}")
print(f"  Bosses: {len(manifest['bosses'])}")
