import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  treeshake: true,
  // Provided by the host Next.js app, never bundled.
  external: ['react', 'react-dom', 'next'],
});
