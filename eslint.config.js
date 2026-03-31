import tsParser from '@typescript-eslint/parser';

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: false },
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/common/inputs/*',
                '**/common/overlays/*',
                '**/common/display/*',
                '**/common/lists/*',
              ],
              message:
                'Import from the barrel index instead (e.g. "../common/inputs" not "../common/inputs/Button").',
            },
            {
              group: ['**/layout/containers/*', '**/layout/navigation/*', '**/layout/shell/*'],
              message:
                'Import from the barrel index instead (e.g. "../layout/containers" not "../layout/containers/Card").',
            },
          ],
        },
      ],
    },
  },
  // Allow internal imports within the barrel subfolders themselves
  {
    files: [
      'src/renderer/components/common/inputs/*.{ts,tsx}',
      'src/renderer/components/common/overlays/*.{ts,tsx}',
      'src/renderer/components/common/display/*.{ts,tsx}',
      'src/renderer/components/common/lists/*.{ts,tsx}',
      'src/renderer/components/layout/containers/*.{ts,tsx}',
      'src/renderer/components/layout/navigation/*.{ts,tsx}',
      'src/renderer/components/layout/shell/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
];
