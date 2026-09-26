import { defineComponent, h } from 'vue';
import type { Component, DefineSetupFnComponent } from 'vue';
import { documentSlug } from '@scadable/core';
import { ScadablePolicy } from './ScadablePolicy';
import type { NamedDocumentProps } from './ScadablePolicy';

/**
 * Build a doc-type-locked wrapper around {@link ScadablePolicy} so the customer
 * only ever provides a token (`<PrivacyPolicy token="..." />`) or the tenant the
 * document is published under (`<PrivacyPolicy tenant="..." />`). The same props
 * (class, initialHtml, baseUrl) flow through; the document is fixed.
 */
function policyFor(docType: string, name: string) {
  const component = defineComponent({
    name,
    props: {
      /** The public token from the SCADABLE app. */
      token: { type: String, default: undefined },
      /** Your organization's id in SCADABLE, for a document published to files.scadable.com. */
      tenant: { type: String, default: undefined },
      /** Class on the wrapper element so you can style/position the document. */
      class: { type: String, default: undefined },
      /** HTML rendered before the live fetch resolves (e.g. baked in by Nuxt SSR for SEO). */
      initialHtml: { type: String, default: '' },
      /** Override the base. Default "https://policy.scadable.com" for a token, "https://files.scadable.com" for a tenant. */
      baseUrl: { type: String, default: undefined },
    },
    setup(props) {
      return () =>
        h(ScadablePolicy as Component, {
          token: props.token,
          docType,
          tenant: props.tenant,
          document: props.tenant === undefined ? undefined : documentSlug(docType),
          class: props.class,
          initialHtml: props.initialHtml,
          baseUrl: props.baseUrl,
        });
    },
  });
  return component as unknown as DefineSetupFnComponent<NamedDocumentProps>;
}

/** Renders your always-current privacy policy: `<PrivacyPolicy token="..." />` or `<PrivacyPolicy tenant="..." />`. */
export const PrivacyPolicy = policyFor('privacy_policy', 'PrivacyPolicy');

/** Renders your always-current terms of use: `<TermsOfUse token="..." />` or `<TermsOfUse tenant="..." />`. */
export const TermsOfUse = policyFor('terms_of_use', 'TermsOfUse');

/** Renders your always-current cookie policy: `<CookiePolicy token="..." />` or `<CookiePolicy tenant="..." />`. */
export const CookiePolicy = policyFor('cookie_policy', 'CookiePolicy');

/** Renders your always-current imprint: `<Imprint token="..." />` or `<Imprint tenant="..." />`. */
export const Imprint = policyFor('imprint', 'Imprint');

export { ScadablePolicy };
export type { ScadablePolicyProps } from './ScadablePolicy';
export {
  fetchPolicy,
  DEFAULT_BASE_URL,
  fetchDocument,
  documentSlug,
  documentUrl,
  DEFAULT_DOCUMENT_BASE_URL,
} from '@scadable/core';
export type {
  Policy,
  FetchPolicyOptions,
  PublishedDocument,
  FetchDocumentOptions,
  DocumentRef,
  DocumentSource,
  DocumentOwner,
} from '@scadable/core';
