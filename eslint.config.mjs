// eslint.config.mjs — ESLint flat config with complexity caps (SPEC-001 §7)
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'coverage/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'voice-worker/.venv/**',
      'next-env.d.ts',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
      'complexity': ['error', { max: 15 }],
      'max-depth': ['error', { max: 3 }],
      'max-params': ['error', { max: 4 }],
    },
  },
  {
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      'e2e/**',
      'scripts/**',
      'prisma/**',
    ],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
    },
  },
];

export default eslintConfig;
