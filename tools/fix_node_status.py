import json

# Update nodes.json to reset consumedStatus for nodes_t4_01
with open('tools/nodes/nodes.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    if item.get('id') == 'nodes_t4_01':
        if item.get('consumedStatus') == 'declined':
            item['consumedStatus'] = 'pending'
            if 'consumedDeclineNote' in item:
                del item['consumedDeclineNote']
            print(f"Reset consumedStatus for {item.get('id')} to pending")

with open('tools/nodes/nodes.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4)

print("Done!")
