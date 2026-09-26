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
  // A document published to files.scadable.com is named by `tenant` and `document`
  // instead of `token` and `docType`, and is inserted only when it passes the
  // allowlist check in @scadable/core (a plain link to it is inserted when it does
  // not).
  //
  // Svelte 4 syntax, which also runs under Svelte 5 in legacy mode.
  import { onMount } from 'svelte';
  import { fetchDocument, fetchPolicy, isAllowedHtml } from '@scadable/core';

  /** The public token from the SCADABLE app. */
  export let token = undefined;
  /** Which document to render with a token. Default "privacy_policy". */
  export let docType = 'privacy_policy';
  /** Your organization's id in SCADABLE, for a document published to files.scadable.com. */
  export let tenant = undefined;
  /** The published document's slug with a tenant, for example "privacy-policy". */
  let slug = undefined;
  export { slug as document };
  /** HTML rendered before the live fetch resolves (e.g. baked in by SvelteKit SSR for SEO). */
  export let initialHtml = '';
  /** Class on the wrapper element so you can style/position the document. */
  let className = '';
  export { className as class };

  // With a tenant, baked HTML is shown only when it passes the same check as the live copy.
  let html = tenant !== undefined && !isAllowedHtml(initialHtml) ? '' : initialHtml;
  let errored = false;

  onMount(() => {
    const load =
      tenant !== undefined
        ? fetchDocument({ tenant, document: slug ?? '' }, { revalidate: false })
        : fetchPolicy(token ?? '', { docType, revalidate: false });
    const what =
      tenant !== undefined ? `document "${slug}" for tenant "${tenant}"` : `policy for token "${token}"`;
    load
      .then((loaded) => {
        if (loaded && loaded.html) html = loaded.html;
      })
      .catch((err) => {
        // Keep the baked copy if the browser fetch is blocked (CSP), offline, or the
        // token/API is bad, but make the failure visible for debugging.
        errored = true;
        console.warn(`[@scadable/svelte] failed to load ${what}`, err);
      });
  });
</script>

<div class={className} data-scadable-error={errored ? 'true' : undefined}>{@html html}</div>
