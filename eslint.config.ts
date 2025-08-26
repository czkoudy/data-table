import tsParser from '@typescript-eslint/parser';
import perfectionist from 'eslint-plugin-perfectionist';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

export default [
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        projectService: true,
      },
    },
    plugins: {
      perfectionist,
      prettier,
      react,
      'react-hooks': reactHooks,
      'unused-imports': unusedImports,
    },
    rules: {
      'consistent-return': 'off',
      eqeqeq: ['error', 'always'],
      'import/prefer-default-export': 'off',
      'jsx-a11y/label-has-associated-control': 0,
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error', 'info'],
        },
      ],
      'no-empty': 'off',
      'no-nested-ternary': 'off',
      'no-param-reassign': 'off',
      'no-underscore-dangle': 0,
      'no-unsafe-optional-chaining': 'off',
      'perfectionist/sort-enums': [
        'warn',
        {
          order: 'asc',
          type: 'natural',
        },
      ],
      'perfectionist/sort-exports': [
        'warn',
        {
          order: 'asc',
          type: 'natural',
        },
      ],
      'perfectionist/sort-imports': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          order: 'asc',
          type: 'natural',
        },
      ],
      'perfectionist/sort-interfaces': [
        'warn',
        {
          order: 'asc',
          type: 'natural',
        },
      ],
      'perfectionist/sort-jsx-props': [
        'warn',
        {
          order: 'asc',
          type: 'natural',
        },
      ],
      'perfectionist/sort-maps': [
        'warn',
        {
          order: 'asc',
          type: 'natural',
        },
      ],
      'perfectionist/sort-objects': [
        'warn',
        {
          order: 'asc',
          type: 'natural',
        },
      ],
      'perfectionist/sort-switch-case': [
        'warn',
        {
          order: 'asc',
          type: 'natural',
        },
      ],
      'prettier/prettier': 'error',
      radix: 'off',

      'react/display-name': 0,
      'react/function-component-definition': 0,
      'react/jsx-props-no-spreading': 0,
      'react/jsx-uses-react': 'off',
      'react/no-array-index-key': 0,
      'react/no-unknown-property': [
        'error',
        {
          ignore: ['css'],
        },
      ],
      'react/no-unstable-nested-components': 0,
      'react/prop-types': 0,
      'react/react-in-jsx-scope': 'off',
      'react/require-default-props': 'off',
      'unused-imports/no-unused-imports': 'error',
    },
  },
  // tseslint.configs.recommended,
  // pluginReact.configs.flat.recommended,
];
