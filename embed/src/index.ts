/**
 * Package entry for bundlers / the SCADABLE app (ESM + CJS).
 *
 * This re-exports the API WITHOUT the auto-boot side effect, so importing
 * `@scadable/embed` in a server or build context (e.g. the in-app Integrate UI
 * calling {@link snapshotSnippet}) never touches the DOM. The browser bundle
 * that auto-runs is `dist/embed.js`; load that with a `<script>` tag instead.
 */
export * from './embed';
