import { defineConfig } from 'tsup';

// Two independent builds:
//
// 1. dist/embed.js - a standalone, minified IIFE for a plain `<script src=...>`
//    on any no-code platform. @scadable/core is bundled in (noExternal) so the
//    file is fully self-contained on the CDN. It auto-boots on load and also
//    exposes the API on `window.ScadablePolicy`.
//
// 2. dist/index.{js,cjs} + index.d.ts - ESM + CJS with no side effects, for the
//    SCADABLE app / bundlers to `import { snapshotSnippet }`. Here @scadable/core
//    stays external so the host bundler dedupes it.
export default defineConfig([
  {
    entry: { embed: 'src/auto.ts' },
    format: ['iife'],
    globalName: 'ScadablePolicy',
    platform: 'browser',
    target: 'es2018',
    minify: true,
    treeshake: true,
    dts: false,
    clean: true,
    noExternal: [/@scadable\/core/],
    // tsup would name an IIFE bundle `embed.global.js`; the README, the CDN URL,
    // and the package's unpkg/jsdelivr fields all point at `embed.js`.
    outExtension: () => ({ js: '.js' }),
  },
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    clean: false,
    treeshake: true,
    external: ['@scadable/core'],
  },
]);
