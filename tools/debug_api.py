"""Debug script to test API merge"""
import sys
sys.path.insert(0, '.')
from dashboard_api.category_handlers import get_category_data

print("=== EQUIPMENT ===")
data = get_category_data('equipment')
if 'error' in data:
    print(f"Error: {data['error']}")
else:
    entities = data.get('entities', [])
    print(f'Entities loaded: {len(entities)}')
    if entities:
        sample = entities[0]
        print(f'Sample ID: {sample.get("id")}')
        print(f'Sample status: {sample.get("status")}')

print("\n=== NODES ===")
data = get_category_data('nodes')
if 'error' in data:
    print(f"Error: {data['error']}")
else:
    entities = data.get('entities', [])
    print(f'Entities loaded: {len(entities)}')
    if entities:
        sample = entities[0]
        print(f'Sample ID: {sample.get("id")}')
