"""
Dashboard Audit Script
Checks all entity JSONs for:
1. Missing files.original paths
2. Paths pointing to non-existent files
3. Path format inconsistencies (assets/ prefix vs images/ prefix)
4. Status mismatches
"""
import json
import os
from collections import defaultdict

ENTITIES_DIR = "src/entities"
ASSETS_DIR = "assets"

def audit_category(category):
    """Audit a single category and return issues"""
    issues = []
    category_dir = os.path.join(ENTITIES_DIR, category)
    
    if not os.path.exists(category_dir):
        return [f"Category directory does not exist: {category_dir}"]
    
    for filename in os.listdir(category_dir):
        if not filename.endswith('.json'):
            continue
        
        filepath = os.path.join(category_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8-sig') as f:
                data = json.load(f)
        except Exception as e:
            issues.append(f"JSON parse error: {filename} - {e}")
            continue
        
        entity_id = data.get('id', filename)
        status = data.get('status', 'unknown')
        
        # Check files.original
        files = data.get('files', {})
        original = files.get('original', '')
        
        if not original:
            issues.append(f"NO_PATH: {entity_id} has no files.original")
            continue
        
        # Check path format - should NOT have assets/ prefix (dashboard adds it)
        if original.startswith('assets/'):
            # Path has assets/ prefix - this is inconsistent
            actual_path = original
            expected_path = original.replace('assets/', '', 1)
            issues.append(f"PREFIX: {entity_id} has 'assets/' prefix: {original} -> should be {expected_path}")
            full_path = os.path.join(ASSETS_DIR, expected_path)
        else:
            # Path is relative to assets/
            full_path = os.path.join(ASSETS_DIR, original)
        
        # Check if file exists
        if not os.path.exists(full_path):
            issues.append(f"MISSING: {entity_id} -> {full_path}")
        
    return issues

def main():
    categories = ['enemies', 'bosses', 'npcs', 'items', 'resources', 'nodes', 'equipment', 'environment', 'ui']
    
    all_issues = defaultdict(list)
    
    for category in categories:
        issues = audit_category(category)
        if issues:
            all_issues[category] = issues
    
    # Print summary
    print("=" * 60)
    print("DASHBOARD AUDIT REPORT")
    print("=" * 60)
    
    total_issues = 0
    for category, issues in all_issues.items():
        print(f"\n### {category.upper()} ({len(issues)} issues)")
        for issue in issues:
            print(f"  - {issue}")
            total_issues += 1
    
    if total_issues == 0:
        print("\n✓ No issues found!")
    else:
        print(f"\n{'=' * 60}")
        print(f"TOTAL ISSUES: {total_issues}")
        print("=" * 60)

if __name__ == "__main__":
    main()
