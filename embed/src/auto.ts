import { init, register } from './embed';

/**
 * Browser entry for the standalone `<script src=".../embed.js">` build.
 *
 * On load it registers the `<scadable-policy>` custom element and brings every
 * `<div class="scadable-policy">` on the page live. Loaded with `async`, this
 * script may run before or after the document is parsed, so we handle both:
 * wait for DOMContentLoaded while still loading, otherwise boot immediately.
 *
 * The whole public API is re-exported below so the IIFE also exposes
 * `window.ScadablePolicy.{init,mount,register,snapshotSnippet,...}` for anyone
 * who wants to drive it by hand.
 */
function boot(): void {
  register();
  init();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
}

export * from './embed';
