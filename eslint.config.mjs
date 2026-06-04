import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // react-hook-form's `watch()` trips the React Compiler memoization
      // heuristics, but the pattern is safe here (compiler is not enabled).
      'react-hooks/incompatible-library': 'warn',
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
];

export default eslintConfig;
