<script>
  // Renders your always-current SCADABLE document (privacy policy, terms of use, ...)
  // pulled live from the SCADABLE API.
  //
  // Zero-friction: give it your public token and you are done. If you pass
  // `initialHtml` (for example from a SvelteKit `load` server fetch) it renders that
  // immediately, so the legal text and the "by scadable.com" backlink are in the
  // server HTML for SEO and the page paints with no layout shift. On mount it
  // re-fetches the live document so edits you publish in SCADABLE go live with no
  // redeploy on your side. If the browser fetch is blocked (a strict
  // Content-Security-Policy) or offline, the baked copy stays put, so the page is
  // never blank.
  //
  // Svelte 4 syntax, which also runs under Svelte 5 in legacy mode.
  import { onMount } from 'svelte';
  import { fetchPolicy } from '@scadable/core';

  /** The public token from the SCADABLE app. */
  export let token;
  /** Which document to render. Default "privacy_policy". */
  export let docType = 'privacy_policy';
  /** HTML rendered before the live fetch resolves (e.g. baked in by SvelteKit SSR for SEO). */
  export let initialHtml = '';
  /** Class on the wrapper element so you can style/position the document. */
  let className = '';
  export { className as class };

  let html = initialHtml;
  let errored = false;

  onMount(() => {
    fetchPolicy(token, { docType, revalidate: false })
      .then((policy) => {
        if (policy && policy.html) html = policy.html;
      })
      .catch((err) => {
        // Keep the baked copy if the browser fetch is blocked (CSP), offline, or the
        // token/API is bad, but make the failure visible for debugging.
        errored = true;
        console.warn(`[@scadable/svelte] failed to load policy for token "${token}"`, err);
      });
  });
</script>

<div class={className} data-scadable-error={errored ? 'true' : undefined}>{@html html}</div>
