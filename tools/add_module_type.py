"""
Script to add type="module" to all script tags in index.html
"""

import re
from pathlib import Path

INDEX_PATH = Path(__file__).parent.parent / "index.html"

def add_module_type():
    content = INDEX_PATH.read_text(encoding="utf-8")
    
    # Pattern: <script src="..."> without type="module"
    # Replace with: <script type="module" src="...">
    
    # Match script tags with src that don't already have type="module"
    pattern = r'<script\s+src="([^"]+)">'
    replacement = r'<script type="module" src="\1">'
    
    new_content = re.sub(pattern, replacement, content)
    
    # Count changes
    old_count = len(re.findall(pattern, content))
    
    INDEX_PATH.write_text(new_content, encoding="utf-8")
    print(f"Updated {old_count} script tags with type='module'")

if __name__ == "__main__":
    add_module_type()
