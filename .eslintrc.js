module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // Allows for the parsing of modern ECMAScript features
    ecmaVersion: 2020,
    // Allows for the use of imports
    sourceType: 'module',
  },
  extends: ['plugin:@typescript-eslint/recommended',
  ],
  globals: {},
  rules: {
    semi: ['error', 'always'],
    'no-cond-assign': ['error', 'except-parens'],
    camelcase: 'off',
    curly: 'off',
    eqeqeq: 'error',
    'no-eq-null': 'error',
    'no-eval': 'off',
    'wrap-iife': 'off',
    indent: [
      'error',
      2,
      {
        SwitchCase: 1,
      },
    ],
    'no-use-before-define': 'off',
    'linebreak-style': ['error', 'unix'],
    'comma-style': ['error', 'last'],
    complexity: ['error', 15],
    'max-depth': ['error', 4],
    'max-statements': ['error', 25],
    'new-cap': 'error',
    'no-empty': [
      'error',
      {
        allowEmptyCatch: true,
      },
    ],
    'no-new': 'off',
    quotes: ['error', 'single'],
    strict: 'off',
    'no-undef': 'error',
    'no-unused-vars': 'warn',
    'eol-last': 'error',
    'key-spacing': [
      'error',
      {
        beforeColon: false,
        afterColon: true,
      },
    ],
    'no-trailing-spaces': 'error',
    'space-infix-ops': 'error',
    'keyword-spacing': ['error', {}],
    'space-unary-ops': [
      'error',
      {
        words: false,
        nonwords: false,
      },
    ],
    'brace-style': [
      'error',
      '1tbs',
      {
        allowSingleLine: true,
      },
    ],
  },
  'overrides': [
    {
      'files': [
        '**/*.spec.js',
        '**/*.spec.jsx'
      ],
      'env': {
        'jest': true
      }
    }
  ]

};
