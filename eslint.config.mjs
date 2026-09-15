import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/* ESLint 9 flat config. `next lint` was removed in Next.js 16; run `yarn lint` (eslint .) instead. */
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', '.cache/**', 'node_modules/**', 'public/**', 'scripts/**', 'next-env.d.ts']),
]);
