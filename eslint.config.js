// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const SOURCE = ['ts', 'tsx'].map((ext) => `**/*.${ext}`);
const inSrc = (...dirs) => dirs.flatMap((dir) => SOURCE.map((glob) => `src/${dir}/${glob}`));

// Outside the current folder, imports go through the `@/` alias, never `../`.
const NO_PARENT_IMPORTS = {
  group: ['../*'],
  message: 'Use the `@/` alias for anything outside the current folder.',
};

const restrict = (...patterns) => ({
  'no-restricted-imports': ['error', { patterns: [NO_PARENT_IMPORTS, ...patterns] }],
});

// The architecture rules live in docs/adr/0001-project-structure.md.
module.exports = defineConfig([
  expoConfig,
  {
    // `legacy/` is the quarantined Supabase-era code; it is not linted.
    ignores: ['dist/*', '.expo/*', 'legacy/**'],
  },
  {
    // Routes stay thin: they reach a feature only through its public entry point.
    files: inSrc('app'),
    rules: restrict({
      group: ['@/features/*/*'],
      message: 'Import from the feature entry point (`@/features/<name>`), not its internals.',
    }),
  },
  {
    // Screens are reachable through routes only, and nothing below the route
    // layer may import back up into it.
    files: inSrc('features', 'lib', 'hooks', 'providers', 'theme', 'utils', 'testing'),
    rules: restrict({
      group: ['@/features/*/screens', '@/features/*/screens/**', '@/app', '@/app/**'],
      message: 'Screens are rendered by routes; do not import them (or routes) from here.',
    }),
  },
  {
    // Shared components are generic building blocks: no feature knowledge.
    files: inSrc('components'),
    rules: restrict({
      group: ['@/features', '@/features/**', '@/app', '@/app/**'],
      message: 'Shared components must not depend on features. Move feature-specific UI into the feature.',
    }),
  },
]);
