// Ship raw .svelte source: a SvelteKit/Vite consumer resolves the "svelte" export
// condition to this file and compiles the components itself.
export { default as ScadablePolicy } from './ScadablePolicy.svelte';
export { default as PrivacyPolicy } from './PrivacyPolicy.svelte';
export { default as TermsOfUse } from './TermsOfUse.svelte';
export { default as CookiePolicy } from './CookiePolicy.svelte';
export { default as Imprint } from './Imprint.svelte';
export {
  fetchPolicy,
  DEFAULT_BASE_URL,
  fetchDocument,
  documentSlug,
  documentUrl,
  DEFAULT_DOCUMENT_BASE_URL,
} from '@scadable/core';
