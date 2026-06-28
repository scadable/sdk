// The Astro components ship as raw .astro files. Import them directly, e.g.
//   import PrivacyPolicy from '@scadable/astro/PrivacyPolicy.astro';
//   import TermsOfUse from '@scadable/astro/TermsOfUse.astro';
//   import ScadablePolicy from '@scadable/astro/ScadablePolicy.astro';
//
// This entry exists for the "render it yourself" case: it re-exports the
// @scadable/core fetch client and types so there is one place to import from.
export { fetchPolicy, DEFAULT_BASE_URL } from '@scadable/core';
export type { Policy, FetchPolicyOptions } from '@scadable/core';
