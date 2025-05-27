module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  globals: {
    React: 'readonly',
  },
  extends: ['eslint:recommended', 'next/core-web-vitals', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    // General rules
    'prefer-const': 'error',
    'no-var': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

    // React specific rules
    'react/prop-types': 'off', // TypeScript handles this
    'react/react-in-jsx-scope': 'off', // Not needed in Next.js
    'react-hooks/exhaustive-deps': 'warn',

    // Next.js specific rules
    '@next/next/no-html-link-for-pages': 'error',
    '@next/next/no-img-element': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'dist/',
    'build/',
    '*.config.js',
    '*.config.ts',
  ],
};
