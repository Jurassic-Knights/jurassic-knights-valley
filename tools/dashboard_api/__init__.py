# Dashboard API Package
# Re-exports all handler functions for easy imports

from .utils import (
    BASE_DIR,
    IMAGES_DIR,
    TOOLS_DIR,
    get_manifest,
    get_status,
    scan_assets
)

from .asset_handlers import (
    regenerate_asset_loader,
    change_status
)

from .entity_handlers import (
    sync_entity_to_json,
    sync_all_entities,
    update_entity_manifest
)

from .category_handlers import (
    get_category_data,
    update_category_status,
    update_consumed_status,
    update_item_stat,
    update_item_weapon,
    update_item_field,
    get_all_categories
)

from .loot_handlers import (
    get_loot_data,
    update_loot_status
)
