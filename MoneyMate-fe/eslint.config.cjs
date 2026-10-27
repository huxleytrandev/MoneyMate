const path = require('node:path');
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.expo/**',
      'coverage/**',
      'expo-env.d.ts',
      'android/**',
      'ios/**',
      'assets/**',
    ],
  },
  expoConfig,
  {
    files: ['eslint.config.cjs'],
    languageOptions: { globals: { __dirname: 'readonly' } },
  },
  {
    settings: {
      'import/resolver': {
        typescript: {
          project: path.resolve(__dirname, 'tsconfig.json'),
          alwaysTryTypes: true,
        },
      },
    },
  },
  prettier,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: path.resolve(__dirname, 'tsconfig.json'),
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    parser: "@typescript-eslint/parser",
    parserOptions: {
      project: "./tsconfig.json"
    }
  }
]);
