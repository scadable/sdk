import { fetchPolicy } from '@scadable/core';
import type { FetchPolicyOptions } from '@scadable/core';

import { PolicyLive } from './PolicyLive';

export interface ScadablePolicyProps extends FetchPolicyOptions {
  /** The public token from the SCADABLE app. */
  token: string;
  /** Optional wrapper class so you can style/position the document. */
  className?: string;
  /** Show a small "Version N, last updated ..." line under the document. Default false. */
  showVersion?: boolean;
}

/**
 * Renders your always-current SCADABLE document for any `docType`.
 *
 * Hybrid by design. The document HTML is fetched at build / server-render time and baked
 * into the static HTML, so the legal text and the "by scadable.com" backlink are
 * crawlable for SEO and paint instantly. It is then re-fetched in the browser (see
 * {@link PolicyLive}) so edits you make in SCADABLE go live with no redeploy on your
 * side. If a strict Content-Security-Policy blocks the browser fetch, the baked copy
 * stays put, so the page is never blank.
 *
 * `docType` defaults to "privacy_policy". Use the {@link PrivacyPolicy} and
 * {@link TermsOfUse} wrappers for the common cases, or set `docType` directly here for
 * any future document type.
 *
 * ```tsx
 * import { ScadablePolicy } from '@scadable/next';
 *
 * export default function Page() {
 *   return <ScadablePolicy token="YOUR_PUBLIC_TOKEN" docType="terms_of_use" />;
 * }
 * ```
 */
export async function ScadablePolicy({
  token,
  className,
  showVersion = false,
  docType = 'privacy_policy',
  ...options
}: ScadablePolicyProps) {
  let policy;
  try {
    policy = await fetchPolicy(token, { ...options, docType });
  } catch (err) {
    // A bad token or a down API must never hard-fail the customer's build / SSR.
    console.warn(`[@scadable/next] failed to load policy for token "${token}"`, err);

    if (process.env.NODE_ENV !== 'production') {
      // In development, surface the real cause inline so it is obvious what broke.
      return (
        <div className={className}>
          <p style={{ fontSize: 13, color: '#b91c1c' }}>
            [@scadable/next] Could not load the {docType} for token &quot;{token}&quot;:{' '}
            {err instanceof Error ? err.message : String(err)}
          </p>
        </div>
      );
    }

    // In production, render nothing baked and let the browser live-refresh fill it in,
    // so the page still builds and recovers on its own once the API is reachable again.
    return (
      <PolicyLive
        token={token}
        initialHtml=""
        className={className}
        showVersion={showVersion}
        baseUrl={options.baseUrl}
        docType={docType}
      />
    );
  }

  return (
    <PolicyLive
      token={token}
      initialHtml={policy.html}
      initialVersion={policy.version}
      initialUpdatedAt={policy.updated_at}
      className={className}
      showVersion={showVersion}
      baseUrl={options.baseUrl}
      docType={docType}
    />
  );
}
