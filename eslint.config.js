export default {
    env: {
        browser: true,
        es2021: true
    },
    extends: ['eslint:recommended'],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    globals: {
        // Game globals
        Logger: 'readonly',
        Registry: 'readonly',
        EntityManager: 'readonly',
        EventBus: 'readonly',
        GameConstants: 'readonly',
        AssetLoader: 'readonly',
        SpawnManager: 'readonly',
        VFXController: 'readonly',
        AudioManager: 'readonly',
        // Entity classes
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
        PropConfig: 'readonly'
    },
    rules: {
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'no-console': 'off',
        'prefer-const': 'warn'
    }
};
