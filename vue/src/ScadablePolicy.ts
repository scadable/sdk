import { defineComponent, h, onMounted, ref } from 'vue';
import type { DefineSetupFnComponent } from 'vue';
import {
  fetchDocument,
  fetchPolicy,
  isAllowedHtml,
  type DocumentOwner,
  type DocumentSource,
  type FetchPolicyOptions,
} from '@scadable/core';

/** How the document is shown, whichever way it is named. */
interface DisplayProps {
  /** Class on the wrapper element so you can style/position the document. */
  class?: string;
  /**
   * HTML rendered before the live fetch resolves (e.g. baked in by Nuxt SSR for
   * SEO). With a tenant it is shown only when it passes the same allowlist check
   * as the live copy.
   */
  initialHtml?: string;
  /**
   * Override the base. Default "https://policy.scadable.com" for a token and
   * "https://files.scadable.com" for a tenant.
   */
  baseUrl?: string;
}

/**
 * Which document to render, a `token` with a `docType` or a `tenant` with a
 * `document`, and how to show it.
 */
export type ScadablePolicyProps = DocumentSource & DisplayProps;

/** Props of a component that fixes its document: a `token` or a `tenant`. */
export type NamedDocumentProps = DocumentOwner & DisplayProps;

/**
 * Renders your always-current SCADABLE document (privacy policy, terms of use, ...)
 * pulled live from the SCADABLE API.
 *
 * Zero-friction: give it your public token and you are done. If you pass
 * `initialHtml` (for example from a Nuxt `useAsyncData` server fetch) it renders
 * that immediately, so the legal text and the "by scadable.com" backlink are in the
 * server HTML for SEO and the page paints with no layout shift. On mount it re-fetches
 * the live document so edits you publish in SCADABLE go live with no redeploy on your
 * side. If the browser fetch is blocked (a strict Content-Security-Policy) or offline,
 * the baked copy stays put, so the page is never blank.
 *
 * A document published to files.scadable.com is named by `tenant` and `document`
 * instead of `token` and `docType`, and is inserted only when it passes the
 * allowlist check in @scadable/core (a plain link to it is inserted when it does not).
 *
 * Authored as a render function (no SFC compiler needed) so it builds with tsup.
 *
 * ```ts
 * import { PrivacyPolicy } from '@scadable/vue';
 * // <PrivacyPolicy token="YOUR_PUBLIC_TOKEN" />
 * ```
 */
const component = defineComponent({
  name: 'ScadablePolicy',
  props: {
    /** The public token from the SCADABLE app. */
    token: { type: String, default: undefined },
    /** Which document to render with a token. Default "privacy_policy". */
    docType: { type: String, default: 'privacy_policy' },
    /** Your organization's id in SCADABLE, for a document published to files.scadable.com. */
    tenant: { type: String, default: undefined },
    /** The published document's slug with a tenant, for example "privacy-policy". */
    document: { type: String, default: undefined },
    /** Class on the wrapper element so you can style/position the document. */
    class: { type: String, default: undefined },
    /** HTML rendered before the live fetch resolves (e.g. baked in by Nuxt SSR for SEO). */
    initialHtml: { type: String, default: '' },
    /** Override the base. Default "https://policy.scadable.com" for a token, "https://files.scadable.com" for a tenant. */
    baseUrl: { type: String, default: undefined },
  },
  setup(props) {
    const html = ref(props.tenant !== undefined && !isAllowedHtml(props.initialHtml) ? '' : props.initialHtml);
    const errored = ref(false);

    onMounted(() => {
      // Keep the baked copy if the browser fetch is blocked (CSP), offline, or the
      // token/API is bad, but make the failure visible for debugging.
      const fail = (what: string) => (err: unknown) => {
        errored.value = true;
        console.warn(`[@scadable/vue] failed to load ${what}`, err);
      };
      if (props.tenant !== undefined) {
        fetchDocument(
          { tenant: props.tenant, document: props.document ?? '' },
          { baseUrl: props.baseUrl, revalidate: false },
        )
          .then((doc) => {
            if (doc.html) html.value = doc.html;
          })
          .catch(fail(`document "${props.document}" for tenant "${props.tenant}"`));
      } else {
        const opts: FetchPolicyOptions = { docType: props.docType, revalidate: false };
        if (props.baseUrl) opts.baseUrl = props.baseUrl;
        fetchPolicy(props.token ?? '', opts)
          .then((policy) => {
            if (policy?.html) html.value = policy.html;
          })
          .catch(fail(`policy for token "${props.token}"`));
      }
    });

    return () =>
      h('div', {
        class: props.class,
        innerHTML: html.value,
        ...(errored.value ? { 'data-scadable-error': 'true' } : {}),
      });
  },
});

// The runtime props above cannot say "a token or a tenant", so the component is
// typed with its props as a union instead, the way Vue types a component defined
// by a setup function. Runtime behavior is the component above, on any Vue 3.
export const ScadablePolicy = component as unknown as DefineSetupFnComponent<ScadablePolicyProps>;

export default ScadablePolicy;
