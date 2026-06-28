import { defineConfig } from 'tsup';

// Two independent builds so the React Server Component (PrivacyPolicy) and the
// client island (PolicyLive) never share a bundle. esbuild strips module-level
// "use client" directives when it merges modules, so we (a) build PolicyLive on
// its own with the directive forced back on via `banner`, and (b) build index
// with PolicyLive marked external, so the server entry imports the client file
// instead of inlining it (which would poison the server component).
// @scadable/core is a runtime dependency, so keep it external (imported, not bundled).
const external = ['react', 'react-dom', 'react/jsx-runtime', 'next', '@scadable/core'];

export default defineConfig([
  {
    entry: { PolicyLive: 'src/PolicyLive.tsx' },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    treeshake: true,
    // The "use client" directive is restored post-build (esbuild strips it here).
    external,
  },
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    clean: false,
    treeshake: true,
    external: [...external, './PolicyLive'],
  },
]);
