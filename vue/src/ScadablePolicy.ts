import { defineComponent, h, onMounted, ref } from 'vue';
import { fetchPolicy, type FetchPolicyOptions } from '@scadable/core';

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
 * Authored as a render function (no SFC compiler needed) so it builds with tsup.
 *
 * ```ts
 * import { PrivacyPolicy } from '@scadable/vue';
 * // <PrivacyPolicy token="YOUR_PUBLIC_TOKEN" />
 * ```
 */
export const ScadablePolicy = defineComponent({
  name: 'ScadablePolicy',
  props: {
    /** The public token from the SCADABLE app. */
    token: { type: String, required: true },
    /** Which document to render. Default "privacy_policy". */
    docType: { type: String, default: 'privacy_policy' },
    /** Class on the wrapper element so you can style/position the document. */
    class: { type: String, default: undefined },
    /** HTML rendered before the live fetch resolves (e.g. baked in by Nuxt SSR for SEO). */
    initialHtml: { type: String, default: '' },
    /** Override the API base. Default "https://policy.scadable.com". */
    baseUrl: { type: String, default: undefined },
  },
  setup(props) {
    const html = ref(props.initialHtml);
    const errored = ref(false);

    onMounted(() => {
      const opts: FetchPolicyOptions = { docType: props.docType, revalidate: false };
      if (props.baseUrl) opts.baseUrl = props.baseUrl;
      fetchPolicy(props.token, opts)
        .then((policy) => {
          if (policy?.html) html.value = policy.html;
        })
        .catch((err) => {
          // Keep the baked copy if the browser fetch is blocked (CSP), offline, or
          // the token/API is bad, but make the failure visible for debugging.
          errored.value = true;
          console.warn(`[@scadable/vue] failed to load policy for token "${props.token}"`, err);
        });
    });

    return () =>
      h('div', {
        class: props.class,
        innerHTML: html.value,
        ...(errored.value ? { 'data-scadable-error': 'true' } : {}),
      });
  },
});

export default ScadablePolicy;
