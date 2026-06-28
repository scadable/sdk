import { defineConfig } from 'tsup';

// Pure client package: the whole module is a client module, so there is no
// server/client split like @scadable/next has. One bundle, with @scadable/core
// inlined (noExternal) so the live-fetch import always resolves in the consumer.
// esbuild strips the module-level "use client" directive when it bundles, so it is
// restored on the built entry files by scripts/postbuild-directives.mjs.
export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  noExternal: ['@scadable/core'],
});
