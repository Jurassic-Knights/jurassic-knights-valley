import json

# Fix icons.json paths to match actual files
with open('tools/ui/icons.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    item_id = item.get('id', '')
    files = item.get('files', {})
    
    # Fix paths - actual files are ui_icon_* or ui_res_* format
    if 'original' in files:
        old_path = files['original']
        # Convert icon_forge -> ui_icon_forge, currency_gold -> ui_res_gold
        if 'icon_' in old_path and 'ui_icon_' not in old_path:
            new_path = old_path.replace('/icon_', '/ui_icon_')
            files['original'] = new_path
            print(f"Fixed original: {old_path} -> {new_path}")
        elif 'currency_' in old_path:
            new_id = item_id  # e.g. ui_res_gold
            new_path = f"assets/images/ui/{new_id}_original.png"
            files['original'] = new_path
            print(f"Fixed original: {old_path} -> {new_path}")
    
    if 'clean' in files:
        old_clean = files['clean']
        if 'icon_' in old_clean and 'ui_icon_' not in old_clean:
            new_clean = old_clean.replace('/icon_', '/ui_icon_')
            files['clean'] = new_clean
            print(f"Fixed clean: {old_clean} -> {new_clean}")
        elif 'currency_' in old_clean:
            new_id = item_id
            new_clean = f"assets/images/ui/{new_id}_clean.png"
            files['clean'] = new_clean
            print(f"Fixed clean: {old_clean} -> {new_clean}")

# Save updated JSON
with open('tools/ui/icons.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4)

print("\nicons.json updated!")
