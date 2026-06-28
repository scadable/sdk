import { defineConfig } from 'tsup';

// vue is a peer dependency, so it stays external (never bundled into the package).
export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  treeshake: true,
  external: ['vue'],
});
