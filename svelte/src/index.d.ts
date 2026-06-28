import { SvelteComponent } from 'svelte';

/** Props shared by every SCADABLE document component. */
export interface ScadablePolicyProps {
  /** The public token from the SCADABLE app. */
  token: string;
  /** Which document to render. Default "privacy_policy". */
  docType?: string;
  /** HTML rendered before the live fetch resolves (e.g. baked in by SvelteKit SSR for SEO). */
  initialHtml?: string;
  /** Class on the wrapper element so you can style/position the document. */
  class?: string;
}

/** The token-only props of the {@link PrivacyPolicy} / {@link TermsOfUse} wrappers (docType is fixed). */
export type DocumentProps = Omit<ScadablePolicyProps, 'docType'>;

/** Renders any SCADABLE document; set `docType` ("privacy_policy" by default). */
export class ScadablePolicy extends SvelteComponent<ScadablePolicyProps> {}

/** Renders your always-current privacy policy. Token-only: `<PrivacyPolicy token="..." />`. */
export class PrivacyPolicy extends SvelteComponent<DocumentProps> {}

/** Renders your always-current terms of use. Token-only: `<TermsOfUse token="..." />`. */
export class TermsOfUse extends SvelteComponent<DocumentProps> {}

export { fetchPolicy, DEFAULT_BASE_URL } from '@scadable/core';
export type { Policy, FetchPolicyOptions } from '@scadable/core';
