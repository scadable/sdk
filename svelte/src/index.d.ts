import { SvelteComponent } from 'svelte';
import type { DocumentOwner, DocumentSource } from '@scadable/core';

/** How the document is shown, whichever way it is named. */
interface DisplayProps {
  /**
   * HTML rendered before the live fetch resolves (e.g. baked in by SvelteKit SSR for
   * SEO). With a tenant it is shown only when it passes the same allowlist check as
   * the live copy.
   */
  initialHtml?: string;
  /** Class on the wrapper element so you can style/position the document. */
  class?: string;
}

/** Props of ScadablePolicy: a `token` with a `docType`, or a `tenant` with a `document`. */
export type ScadablePolicyProps = DocumentSource & DisplayProps;

/** Props of the named components (the document is fixed): a `token` or a `tenant`. */
export type DocumentProps = DocumentOwner & DisplayProps;

/** Renders any SCADABLE document: a `token` and a `docType` ("privacy_policy" by default), or a `tenant` and a `document`. */
export class ScadablePolicy extends SvelteComponent<ScadablePolicyProps> {}

/** Renders your always-current privacy policy: `<PrivacyPolicy token="..." />` or `<PrivacyPolicy tenant="..." />`. */
export class PrivacyPolicy extends SvelteComponent<DocumentProps> {}

/** Renders your always-current terms of use: `<TermsOfUse token="..." />` or `<TermsOfUse tenant="..." />`. */
export class TermsOfUse extends SvelteComponent<DocumentProps> {}

/** Renders your always-current cookie policy: `<CookiePolicy token="..." />` or `<CookiePolicy tenant="..." />`. */
export class CookiePolicy extends SvelteComponent<DocumentProps> {}

/** Renders your always-current imprint: `<Imprint token="..." />` or `<Imprint tenant="..." />`. */
export class Imprint extends SvelteComponent<DocumentProps> {}

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
