"""
Script to clean up index.html by removing manual script tags
and using a single entry point
"""

import re
from pathlib import Path

INDEX_PATH = Path(__file__).parent.parent / "index.html"

def clean_index_html():
    content = INDEX_PATH.read_text(encoding="utf-8")
    
    # Find the section starting with "<!-- Core Scripts (order matters) -->"
    # and replace everything up to the last script tag with just main.js
    
    # Pattern to match from "<!-- Core Scripts" to before "</body>"
    pattern = r'(\s*<!-- Core Scripts \(order matters\) -->.*?)(\s*</body>)'
    
    replacement = '''
    <!-- Single Entry Point - All modules bundled by Vite -->
    <script type="module" src="/src/main.js"></script>
</body>'''
    
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    # Also remove the html2canvas CDN link as it's now bundled
    # But keep external CDN links that can't be bundled
    
    INDEX_PATH.write_text(new_content, encoding="utf-8")
    
    # Count script tags before and after
    old_count = len(re.findall(r'<script.*?>', content))
    new_count = len(re.findall(r'<script.*?>', new_content))
    
    print(f"Replaced {old_count} script tags with {new_count}")

if __name__ == "__main__":
    clean_index_html()
