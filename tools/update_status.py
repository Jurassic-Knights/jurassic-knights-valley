import json

with open('tools/enemies/herbivore.json', 'r') as f:
    data = json.load(f)

# Update status to pending for all herbivores with images
for h in data:
    h['status'] = 'pending'
    if 'declineNote' in h:
        del h['declineNote']

with open('tools/enemies/herbivore.json', 'w') as f:
    json.dump(data, f, indent=4)

print('Updated all herbivores to pending status')
