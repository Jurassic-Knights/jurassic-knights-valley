import json

# Add files field to human.json
with open('tools/enemies/human.json', 'r') as f:
    data = json.load(f)

for h in data:
    if 'files' not in h:
        h['files'] = {'original': f"assets/images/enemies/{h['id']}_original.png"}
        print(f"Added files to {h['id']}")

with open('tools/enemies/human.json', 'w') as f:
    json.dump(data, f, indent=4)

print(f"\nUpdated {len(data)} humans")
