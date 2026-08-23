// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

// oxlint handles almost everything; this config exists only for rules oxlint
// doesn't implement yet (e.g. react/jsx-newline). eslint-plugin-oxlint strips
// out any rule oxlint already covers so the two linters never disagree.
import js from '@eslint/js'
import react from 'eslint-plugin-react'
import oxlint from 'eslint-plugin-oxlint'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config({ ignores: ['dist', 'storybook-static'] }, {
  extends: [js.configs.recommended, ...tseslint.configs.recommended],
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
  },
  plugins: {
    react,
  },
  rules: {
    'react/jsx-newline': ['error', { prevent: false }],
  },
  settings: {
    react: { version: 'detect' },
  },
}, // Must come last: disables any rule above that oxlint already lints.
...oxlint.configs['flat/recommended'], storybook.configs["flat/recommended"]);
