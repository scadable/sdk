import * as React from 'react';

import { fetchPolicy } from './client';
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
 * A React Server Component that renders your always-current privacy policy.
 *
 * It is server-rendered, so the legal text is in the initial HTML (crawlable),
 * and cached via Next.js ISR (the `revalidate` option), so it stays current
 * without fetching on every request. The HTML comes from the SCADABLE API
 * (your own published, trusted content), injected as a content fragment.
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
    <div className={className}>
      <div dangerouslySetInnerHTML={{ __html: policy.html }} />
      {showVersion && policy.updated_at ? (
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 24 }}>
          Version {policy.version}. Last updated{' '}
          {new Date(policy.updated_at).toLocaleDateString()}.
        </p>
      ) : null}
    </div>
  );
}
