import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Allow _-prefixed identifiers as intentionally-unused sentinels
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],

      // Context files export both a provider component AND a custom hook; that
      // pattern is idiomatic React but violates the strict react-refresh rule.
      // Downgrade to warn so fast-refresh still works in dev while CI stays green.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // react-hooks v7 introduced three new strict rules that flag common,
      // intentional patterns in existing code (e.g. setLoading(true) at the top
      // of a useEffect before kicking off a fetch). Downgrade to warnings until
      // the codebase is incrementally updated to the new idioms.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability':        'warn',
      'react-hooks/purity':              'warn',
    },
  },
])
