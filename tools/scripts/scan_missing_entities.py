"""
Scan for Missing Entity Cards

Compares assets/images/{category} with src/entities/{category}
and creates entity .ts files for any images missing entity cards.

Usage: python tools/scripts/scan_missing_entities.py [--category ui] [--dry-run]
"""

import os
import re
import json
import argparse
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent.parent
IMAGES_DIR = BASE_DIR / "assets" / "images"
ENTITIES_DIR = BASE_DIR / "src" / "entities"


ENTITY_TYPE_MAP = {
    'enemies': 'EnemyEntity',
    'bosses': 'BossEntity',
    'equipment': 'EquipmentEntity',
    'items': 'ItemEntity',
    'resources': 'ResourceEntity',
    'nodes': 'NodeEntity',
    'environment': 'EnvironmentEntity',
    'npcs': 'NPCEntity',
    'hero': 'HeroEntity',
    'ui': 'UIEntity',
}


def extract_asset_id(filename: str) -> str:
    """Extract asset ID from filename by removing suffixes."""
    # Remove extension
    name = Path(filename).stem
    # Remove status suffixes
    for suffix in ['_original', '_clean', '_approved', '_declined', '_final']:
        name = name.replace(suffix, '')
    return name


def get_existing_entity_ids(category_dir: Path) -> set:
    """Get set of entity IDs from existing .ts files."""
    ids = set()
    if not category_dir.exists():
        return ids
    
    for ts_file in category_dir.rglob("*.ts"):
        if ts_file.name == "index.ts":
            continue
        # Read file and extract ID
        try:
            content = ts_file.read_text(encoding='utf-8')
            match = re.search(r'"id":\s*"([^"]+)"', content)
            if match:
                ids.add(match.group(1))
            else:
                # Use filename as fallback
                ids.add(ts_file.stem)
        except Exception:
            ids.add(ts_file.stem)
    
    return ids


def get_image_assets(images_dir: Path) -> dict:
    """Get all image assets grouped by ID, including prompt sidecar files."""
    assets = {}
    
    if not images_dir.exists():
        return assets
    
    for img_file in images_dir.rglob("*.png"):
        asset_id = extract_asset_id(img_file.name)
        
        if asset_id not in assets:
            assets[asset_id] = {
                'id': asset_id,
                'files': {},
                'path': str(img_file.relative_to(BASE_DIR)).replace('\\', '/'),
                'prompt': None
            }
        
        # Categorize file type
        if '_clean' in img_file.name:
            assets[asset_id]['files']['clean'] = str(img_file.relative_to(BASE_DIR)).replace('\\', '/')
        elif '_original' in img_file.name:
            assets[asset_id]['files']['original'] = str(img_file.relative_to(BASE_DIR)).replace('\\', '/')
        
        # Look for prompt sidecar file
        prompt_file = img_file.parent / f"{asset_id}.prompt.txt"
        if prompt_file.exists() and assets[asset_id]['prompt'] is None:
            try:
                assets[asset_id]['prompt'] = prompt_file.read_text(encoding='utf-8').strip()
            except Exception:
                pass
    
    return assets


def generate_name_from_id(asset_id: str) -> str:
    """Generate human-readable name from asset ID."""
    # Remove common prefixes
    name = asset_id
    for prefix in ['ui_icon_', 'ui_res_', 'stat_', 'ui_']:
        if name.startswith(prefix):
            name = name[len(prefix):]
            break
    
    # Convert underscores to spaces and title case
    name = name.replace('_', ' ').title()
    return name


def create_entity_file(category: str, asset_id: str, files: dict, prompt: str = None, dry_run: bool = False) -> bool:
    """Create a new entity .ts file for the asset."""
    entity_type = ENTITY_TYPE_MAP.get(category, 'BaseEntity')
    name = generate_name_from_id(asset_id)
    
    entity = {
        'id': asset_id,
        'name': name,
        'category': category,
        'status': 'pending',
        'sourceDescription': f'{name} icon, detailed pixel art iconography',
        'files': files
    }
    
    # Add prompt if sidecar file was found
    if prompt:
        entity['prompt'] = prompt
    
    json_str = json.dumps(entity, indent=4)
    ts_content = f'''/**
 * Entity: {asset_id}
 * Auto-generated. Edit in dashboard.
 */
import type {{ {entity_type} }} from '@types/entities';

export default {json_str} satisfies {entity_type};
'''
    
    entity_dir = ENTITIES_DIR / category
    entity_dir.mkdir(parents=True, exist_ok=True)
    entity_file = entity_dir / f"{asset_id}.ts"
    
    if dry_run:
        prompt_status = " [+prompt]" if prompt else ""
        print(f"  [DRY-RUN] Would create: {entity_file.relative_to(BASE_DIR)}{prompt_status}")
        return True
    
    entity_file.write_text(ts_content, encoding='utf-8')
    prompt_status = " [+prompt]" if prompt else ""
    print(f"  [OK] Created: {entity_file.relative_to(BASE_DIR)}{prompt_status}")
    return True


def scan_category(category: str, dry_run: bool = False) -> tuple:
    """Scan a category for missing entities. Returns (created, existing, total)."""
    images_dir = IMAGES_DIR / category
    entities_dir = ENTITIES_DIR / category
    
    print(f"\n{'='*50}")
    print(f"Scanning: {category}")
    print(f"  Images dir: {images_dir.relative_to(BASE_DIR)}")
    print(f"  Entities dir: {entities_dir.relative_to(BASE_DIR)}")
    
    # Get existing entity IDs
    existing_ids = get_existing_entity_ids(entities_dir)
    print(f"  Existing entities: {len(existing_ids)}")
    
    # Get image assets
    image_assets = get_image_assets(images_dir)
    print(f"  Image assets: {len(image_assets)}")
    
    # Find missing
    missing = []
    for asset_id, asset_data in image_assets.items():
        if asset_id not in existing_ids:
            missing.append((asset_id, asset_data))
    
    print(f"  Missing entities: {len(missing)}")
    
    # Create missing entities
    created = 0
    prompts_found = 0
    for asset_id, asset_data in missing:
        prompt = asset_data.get('prompt')
        if prompt:
            prompts_found += 1
        if create_entity_file(category, asset_id, asset_data['files'], prompt, dry_run):
            created += 1
    
    if prompts_found > 0:
        print(f"  Prompt sidecar files found: {prompts_found}")
    
    return created, len(existing_ids), len(image_assets)


def main():
    parser = argparse.ArgumentParser(description='Scan for missing entity cards')
    parser.add_argument('--category', '-c', help='Specific category to scan (default: all)')
    parser.add_argument('--dry-run', '-n', action='store_true', help='Show what would be created without creating')
    args = parser.parse_args()
    
    categories = [args.category] if args.category else list(ENTITY_TYPE_MAP.keys())
    
    print("="*50)
    print("SCAN FOR MISSING ENTITY CARDS")
    print("="*50)
    if args.dry_run:
        print("*** DRY RUN MODE - No files will be created ***")
    
    total_created = 0
    total_existing = 0
    total_assets = 0
    
    for cat in categories:
        created, existing, assets = scan_category(cat, args.dry_run)
        total_created += created
        total_existing += existing
        total_assets += assets
    
    print(f"\n{'='*50}")
    print("SUMMARY")
    print(f"{'='*50}")
    print(f"  Total image assets: {total_assets}")
    print(f"  Already had entities: {total_existing}")
    print(f"  Created new entities: {total_created}")
    
    if args.dry_run and total_created > 0:
        print(f"\nRun without --dry-run to create {total_created} entity files.")


if __name__ == "__main__":
    main()
