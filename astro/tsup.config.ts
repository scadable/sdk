import { defineConfig } from 'tsup';

// Only the optional `.` data entry (src/index.ts) is bundled. The Astro
// components are shipped as raw .astro files (Astro libraries do not bundle
// components), so they are not part of this build.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
});
