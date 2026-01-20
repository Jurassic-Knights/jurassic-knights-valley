import globals from 'globals';
import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node, // For vite.config.js (__dirname)
                ...globals.es2021,
                // Core
                Logger: 'readonly',
                Registry: 'readonly',
                EntityManager: 'readonly',
                EventBus: 'readonly',
                Events: 'readonly',
                GameConstants: 'readonly',
                AssetLoader: 'readonly',
                GameRenderer: 'readonly',
                Entity: 'readonly',
                // Managers
                SpawnManager: 'readonly',
                VFXController: 'readonly',
                AudioManager: 'readonly',
                IslandManager: 'readonly',
                BiomeManager: 'readonly',
                UIManager: 'readonly',
                // Entities
                Hero: 'readonly',
                Enemy: 'readonly',
                Dinosaur: 'readonly',
                Resource: 'readonly',
                DroppedItem: 'readonly',
                Merchant: 'readonly',
                // Components
                HealthComponent: 'readonly',
                StatsComponent: 'readonly',
                // Configs
                EntityConfig: 'readonly',
                VFXConfig: 'readonly',
                BiomeConfig: 'readonly',
                PropConfig: 'readonly',
                RenderConfig: 'readonly',
                // Renderers
                ParticleRenderer: 'readonly',
                ProgressBarRenderer: 'readonly',
                // UI
                CraftingUI: 'readonly',
                // External libs
                html2canvas: 'readonly',
                // i18n
                i18n: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': 'off',
            'prefer-const': 'warn'
        }
    }
];


