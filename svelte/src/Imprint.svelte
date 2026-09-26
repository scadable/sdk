<script>
  // Renders your always-current imprint: `<Imprint token="YOUR_PUBLIC_TOKEN" />`,
  // or `<Imprint tenant="YOUR_TENANT" />` for the one published to
  // files.scadable.com. A thin wrapper over ScadablePolicy with the document locked
  // to "imprint".
  import { documentSlug } from '@scadable/core';
  import ScadablePolicy from './ScadablePolicy.svelte';

  /** The public token from the SCADABLE app. */
  export let token = undefined;
  /** Your organization's id in SCADABLE, for the document published to files.scadable.com. */
  export let tenant = undefined;
  /** HTML rendered before the live fetch resolves (e.g. baked in by SvelteKit SSR for SEO). */
  export let initialHtml = '';
  /** Class on the wrapper element so you can style/position the document. */
  let className = '';
  export { className as class };
</script>

<ScadablePolicy
  {token}
  docType="imprint"
  {tenant}
  document={documentSlug('imprint')}
  {initialHtml}
  class={className}
/>
