import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.ts', '**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021,

                // Core Systems
                Logger: 'readonly',
                Registry: 'readonly',
                EventBus: 'readonly',
                Events: 'readonly',
                EntityManager: 'readonly',
                GameConstants: 'readonly',
                GameInstance: 'readonly',
                GameRenderer: 'readonly',
                GameState: 'readonly',
                Entity: 'readonly',

                // Asset & Config
                AssetLoader: 'readonly',
                EntityConfig: 'readonly',
                VFXConfig: 'readonly',
                BiomeConfig: 'readonly',
                PropConfig: 'readonly',
                RenderConfig: 'readonly',
                EntityTypes: 'readonly',
                EntityLoader: 'readonly',
                ColorPalette: 'readonly',

                // Managers
                SpawnManager: 'readonly',
                VFXController: 'readonly',
                AudioManager: 'readonly',
                IslandManager: 'readonly',
                BiomeManager: 'readonly',
                UIManager: 'readonly',
                InputSystem: 'readonly',
                TimeSystem: 'readonly',
                WeatherSystem: 'readonly',
                PlatformManager: 'readonly',
                QuestManager: 'readonly',
                EquipmentManager: 'readonly',

                // Entities
                Hero: 'readonly',
                Enemy: 'readonly',
                Dinosaur: 'readonly',
                Resource: 'readonly',
                DroppedItem: 'readonly',
                Merchant: 'readonly',
                Boss: 'readonly',
                Prop: 'readonly',

                // Components
                HealthComponent: 'readonly',
                StatsComponent: 'readonly',
                InventoryComponent: 'readonly',
                CombatComponent: 'readonly',
                AIComponent: 'readonly',

                // Renderers
                ParticleRenderer: 'readonly',
                ProgressBarRenderer: 'readonly',
                HeroRenderer: 'readonly',
                DinosaurRenderer: 'readonly',
                WorldRenderer: 'readonly',
                EnvironmentRenderer: 'readonly',

                // VFX
                ParticleSystem: 'readonly',
                FloatingText: 'readonly',
                FloatingTextManager: 'readonly',
                ProjectileVFX: 'readonly',
                MeleeTrailVFX: 'readonly',
                LightingSystem: 'readonly',

                // UI
                InventoryUI: 'readonly',
                MerchantUI: 'readonly',
                EquipmentUI: 'readonly',
                EquipmentUIRenderer: 'readonly',
                EquipmentSlotManager: 'readonly',
                ForgeController: 'readonly',
                CraftingUI: 'readonly',
                ContextActionUI: 'readonly',
                HUDController: 'readonly',

                // Services
                HeroCombatService: 'readonly',
                VFXTriggerService: 'readonly',
                IslandUpgrades: 'readonly',

                // World
                HomeBase: 'readonly',

                // Audio
                ProceduralSFX: 'readonly',
                SFX: 'readonly',

                // External libs
                html2canvas: 'readonly',

                // i18n
                i18n: 'readonly',

                // Legacy/Deprecated (to be removed)
                TileMap: 'readonly',
                RocksData: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': 'off',
            'prefer-const': 'warn',

            // Relaxing rules for current codebase state
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-empty-interface': 'off',
            'no-undef': 'off',
            'no-var': 'off',
            'no-redeclare': 'off',
            '@typescript-eslint/no-this-alias': 'off',
            'no-prototype-builtins': 'off'
        }
    }
];
