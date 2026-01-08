# Jurassic Knights: Valley - Technical Guidelines

## 1. Naming Conventions

### Asset IDs (Snake Case)
| Category | Prefix | Example |
|----------|--------|---------|
| UI Elements | `ui_` | `ui_btn_primary`, `ui_frame_gold` |
| Characters | `char_` | `char_knight_idle`, `char_raptor_attack` |
| Backgrounds | `bg_` | `bg_valley_sunrise` |
| Items | `item_` | `item_sword_steel` |
| Props | `prop_` | `prop_dead_stump` |
| Effects | `fx_` | `fx_spark_gold` |
| Sound Effects | `sfx_` | `sfx_click` |
| Music | `bgm_` | `bgm_main_theme` |

### File Naming
-   Use `snake_case`.
-   Match Asset ID where possible.
-   Suffixes: `_clean` (processed), `_raw` (original), `_sm`/`_lg` (size).

### Naming Conventions
-   **ID Naming (Code)**: Logic IDs are permanent `snake_case` keys (e.g., `knight_squire`).
-   **Asset IDs**:
    -   `ui_`: User Interface
    -   `char_`: Characters
    -   `bg_`: Backgrounds
    -   `sfx_` / `bgm_`: Audio

### Entity Logic IDs
-   Permanent, `snake_case`, descriptive.
-   Example: `knight_captain`, `dino_raptor_alpha`.

## 2. Text Constraints
-   **Buttons**: 2-3 words.
-   **Tooltips**: 1 sentence.
-   **Lore**: 1-2 paragraphs.
