#!/usr/bin/env python3
"""
Full system audit script for Jurassic Knights: Valley
Checks for inconsistencies, orphan files, missing fields, and pattern violations.
"""

import os
import json
import re
from pathlib import Path
from collections import defaultdict

BASE = Path(__file__).parent.parent
ENTITIES = BASE / "src" / "entities"
SRC = BASE / "src"
ASSETS = BASE / "assets"

findings = defaultdict(list)

def log(category, severity, message):
    findings[category].append((severity, message))
    icon = {"CRITICAL": "[X]", "HIGH": "[!]", "MEDIUM": "[~]", "LOW": "[.]"}.get(severity, "[ ]")
    print(f"  {icon} [{severity}] {message}")

# ============================================================
# 1. MANIFEST vs FILES CONSISTENCY
# ============================================================
print("\n=== 1. Manifest vs Files Consistency ===")

manifest = json.loads((ENTITIES / "manifest.json").read_text(encoding="utf-8-sig"))

for category in ["enemies", "bosses", "nodes", "resources", "items", "equipment", "npcs", "environment"]:
    folder = ENTITIES / category
    if not folder.exists():
        continue
    
    files_on_disk = {f.stem for f in folder.glob("*.json") if not f.stem.startswith("_")}
    in_manifest = set(manifest.get(category, []))
    
    missing_from_manifest = files_on_disk - in_manifest
    in_manifest_no_file = in_manifest - files_on_disk
    
    for m in missing_from_manifest:
        log("manifest", "MEDIUM", f"{category}/{m}.json exists but not in manifest")
    for m in in_manifest_no_file:
        log("manifest", "HIGH", f"{category}/{m} in manifest but file missing")

# ============================================================
# 2. ENTITY JSON REQUIRED FIELDS
# ============================================================
print("\n=== 2. Entity JSON Required Fields ===")

REQUIRED_FIELDS = {
    "enemies": ["id", "name", "tier", "sourceFile", "species"],
    "bosses": ["id", "name", "tier", "sourceFile", "species"],
    "nodes": ["id", "name", "tier"],
    "items": ["id", "name"],
    "resources": ["id", "name"],
    "equipment": ["id", "name", "tier"],
    "npcs": ["id", "name"],
}

# Human enemies need bodyType instead of species
for category, required in REQUIRED_FIELDS.items():
    folder = ENTITIES / category
    if not folder.exists():
        continue
    
    for file in folder.glob("*.json"):
        if file.stem.startswith("_"):
            continue
        try:
            data = json.loads(file.read_text(encoding="utf-8-sig"))
            for field in required:
                # Special case: humans use bodyType instead of species
                if field == "species" and data.get("sourceFile") == "human":
                    if "bodyType" not in data:
                        log("entity_fields", "HIGH", f"{file.stem}: missing bodyType (human)")
                elif field not in data:
                    log("entity_fields", "HIGH" if field in ["id", "tier"] else "MEDIUM", 
                        f"{file.stem}: missing {field}")
        except Exception as e:
            log("entity_fields", "CRITICAL", f"{file.stem}: JSON parse error: {e}")

# ============================================================
# 3. ASSETLOADER vs IMAGE FILES
# ============================================================
print("\n=== 3. AssetLoader vs Image Files ===")

assetloader_path = SRC / "core" / "AssetLoader.js"
if assetloader_path.exists():
    content = assetloader_path.read_text(encoding="utf-8")
    
    # Extract registered image paths from AssetLoader
    registered_paths = set(re.findall(r'"path":\s*"images/([^"]+)"', content))
    
    # Find actual image files
    images_dir = ASSETS / "images"
    actual_files = set()
    if images_dir.exists():
        for img in images_dir.rglob("*_clean.png"):
            rel = str(img.relative_to(images_dir)).replace("\\", "/")
            actual_files.add(rel)
    
    # Check for orphans
    orphan_images = actual_files - registered_paths
    missing_images = registered_paths - actual_files
    
    for o in list(orphan_images)[:10]:  # Limit output
        log("assets", "LOW", f"Orphan image (not in AssetLoader): {o}")
    if len(orphan_images) > 10:
        log("assets", "LOW", f"... and {len(orphan_images) - 10} more orphan images")
    
    for m in list(missing_images)[:10]:
        log("assets", "HIGH", f"Registered but missing: {m}")
    if len(missing_images) > 10:
        log("assets", "HIGH", f"... and {len(missing_images) - 10} more missing images")

# ============================================================
# 4. JS FILES NOT IN INDEX.HTML
# ============================================================
print("\n=== 4. JS Files Not in index.html ===")

index_html = (BASE / "index.html").read_text(encoding="utf-8")
for js_file in SRC.rglob("*.js"):
    rel_path = str(js_file.relative_to(BASE)).replace("\\", "/")
    if rel_path not in index_html and js_file.name not in index_html:
        # Exclude test files, workers, etc.
        if not any(x in str(js_file) for x in ["test", "worker", "unused", "__"]):
            log("orphan_js", "MEDIUM", f"JS file not in index.html: {rel_path}")

# ============================================================
# 5. SPECIES IN SpeciesScaleConfig
# ============================================================
print("\n=== 5. Species Coverage in SpeciesScaleConfig ===")

species_config_path = SRC / "config" / "SpeciesScaleConfig.js"
if species_config_path.exists():
    config_content = species_config_path.read_text(encoding="utf-8")
    
    # Extract species from config
    config_species = set(re.findall(r"'([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)':\s*[\d.]+", config_content))
    
    # Extract species from entity JSONs
    entity_species = set()
    for category in ["enemies", "bosses"]:
        folder = ENTITIES / category
        if folder.exists():
            for file in folder.glob("*.json"):
                try:
                    data = json.loads(file.read_text(encoding="utf-8-sig"))
                    if data.get("species"):
                        entity_species.add(data["species"])
                except:
                    pass
    
    missing_species = entity_species - config_species
    for s in missing_species:
        log("species_scale", "MEDIUM", f"Species '{s}' used in entities but not in SpeciesScaleConfig")

# ============================================================
# SUMMARY
# ============================================================
print("\n" + "="*60)
print("AUDIT SUMMARY")
print("="*60)

total = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
for category, items in findings.items():
    print(f"\n{category.upper()}:")
    for severity, msg in items:
        total[severity] += 1

print(f"\n[TOTALS]:")
print(f"  [X] CRITICAL: {total['CRITICAL']}")
print(f"  [!] HIGH: {total['HIGH']}")
print(f"  [~] MEDIUM: {total['MEDIUM']}")
print(f"  [.] LOW: {total['LOW']}")

# Write report
report_path = BASE / "audit_report.md"
with open(report_path, "w", encoding="utf-8") as f:
    f.write("# System Audit Report\n\n")
    f.write(f"**Date**: Auto-generated\n\n")
    f.write("## Summary\n\n")
    f.write(f"| Severity | Count |\n|----------|-------|\n")
    f.write(f"| CRITICAL | {total['CRITICAL']} |\n")
    f.write(f"| HIGH | {total['HIGH']} |\n")
    f.write(f"| MEDIUM | {total['MEDIUM']} |\n")
    f.write(f"| LOW | {total['LOW']} |\n\n")
    
    f.write("## Findings\n\n")
    for category, items in findings.items():
        f.write(f"### {category.replace('_', ' ').title()}\n\n")
        for severity, msg in items:
            f.write(f"- **{severity}**: {msg}\n")
        f.write("\n")

print(f"\n[Report] Written to: {report_path}")
