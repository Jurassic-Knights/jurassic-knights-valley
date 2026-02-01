import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Flat Config for ESLint 9+
export default tseslint.config(
    {
        ignores: ['dist', 'node_modules', 'tools/dashboard/dist']
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-undef': 'off' // Handled by TS
        }
    }
);
