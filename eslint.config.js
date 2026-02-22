import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Flat Config for ESLint 9+
export default tseslint.config(
    {
        ignores: ['dist', 'node_modules', 'tools/dashboard/dist', 'libs/rpgui/**', '**/*.cjs']
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-undef': 'off', // Handled by TS
            'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
            'max-lines-per-function': ['warn', { max: 150 }]
        }
    },
    {
        files: ['**/*.d.ts', '**/asset_manifest*.ts', '**/mapgen4/**', 'tools/**/*'],
        rules: { 'max-lines': 'off', 'max-lines-per-function': 'off' }
    },
    {
        files: ['**/*.cjs', '**/*.js'],
        rules: { '@typescript-eslint/no-require-imports': 'off' }
    }
);
