<script>
  // Renders your always-current privacy policy. Token-only:
  // `<PrivacyPolicy token="YOUR_PUBLIC_TOKEN" />`. A thin wrapper over
  // ScadablePolicy with docType locked to "privacy_policy".
  import ScadablePolicy from './ScadablePolicy.svelte';

  /** The public token from the SCADABLE app. */
  export let token;
  /** HTML rendered before the live fetch resolves (e.g. baked in by SvelteKit SSR for SEO). */
  export let initialHtml = '';
  /** Class on the wrapper element so you can style/position the document. */
  let className = '';
  export { className as class };
</script>

<ScadablePolicy {token} docType="privacy_policy" {initialHtml} class={className} />
