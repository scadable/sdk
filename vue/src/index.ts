import { defineComponent, h } from 'vue';
import { ScadablePolicy } from './ScadablePolicy';

/**
 * Build a doc-type-locked wrapper around {@link ScadablePolicy} so the customer
 * only ever provides a token (`<PrivacyPolicy token="..." />`). The same props
 * (token, class, initialHtml, baseUrl) flow through; docType is fixed.
 */
function policyFor(docType: string, name: string) {
  return defineComponent({
    name,
    props: {
      /** The public token from the SCADABLE app. */
      token: { type: String, required: true },
      /** Class on the wrapper element so you can style/position the document. */
      class: { type: String, default: undefined },
      /** HTML rendered before the live fetch resolves (e.g. baked in by Nuxt SSR for SEO). */
      initialHtml: { type: String, default: '' },
      /** Override the API base. Default "https://api.scadable.com". */
      baseUrl: { type: String, default: undefined },
    },
    setup(props) {
      return () =>
        h(ScadablePolicy, {
          token: props.token,
          docType,
          class: props.class,
          initialHtml: props.initialHtml,
          baseUrl: props.baseUrl,
        });
    },
  });
}

/** Renders your always-current privacy policy. Token-only: `<PrivacyPolicy token="..." />`. */
export const PrivacyPolicy = policyFor('privacy_policy', 'PrivacyPolicy');

/** Renders your always-current terms of use. Token-only: `<TermsOfUse token="..." />`. */
export const TermsOfUse = policyFor('terms_of_use', 'TermsOfUse');

export { ScadablePolicy };
export { fetchPolicy, DEFAULT_BASE_URL } from '@scadable/core';
export type { Policy, FetchPolicyOptions } from '@scadable/core';
