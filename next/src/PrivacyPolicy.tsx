import { fetchPolicy } from './client';
import { PolicyLive } from './PolicyLive';
import type { FetchPolicyOptions } from './types';

export interface PrivacyPolicyProps extends FetchPolicyOptions {
  /** The public token from the SCADABLE app. */
  token: string;
  /** Optional wrapper class so you can style/position the policy. */
  className?: string;
  /** Show a small "Version N, last updated ..." line under the policy. Default false. */
  showVersion?: boolean;
}

/**
 * Renders your always-current privacy policy.
 *
 * Hybrid by design. The policy HTML is fetched at build / server-render time and baked
 * into the static HTML, so the legal text and the "by scadable.com" backlink are
 * crawlable for SEO and paint instantly. It is then re-fetched in the browser (see
 * {@link PolicyLive}) so edits you make in SCADABLE go live with no redeploy on your
 * side. If a strict Content-Security-Policy blocks the browser fetch, the baked copy
 * stays put, so the page is never blank.
 *
 * ```tsx
 * import { PrivacyPolicy } from '@scadable/privacy';
 *
 * export default function Page() {
 *   return <PrivacyPolicy token="YOUR_PUBLIC_TOKEN" />;
 * }
 * ```
 */
export async function PrivacyPolicy({
  token,
  className,
  showVersion = false,
  ...options
}: PrivacyPolicyProps) {
  const policy = await fetchPolicy(token, options);
  return (
    <PolicyLive
      token={token}
      initialHtml={policy.html}
      initialVersion={policy.version}
      initialUpdatedAt={policy.updated_at}
      className={className}
      showVersion={showVersion}
      baseUrl={options.baseUrl}
      docType={options.docType}
    />
  );
}
