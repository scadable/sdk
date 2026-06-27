import type { FetchPolicyOptions, Policy } from './types';

export const DEFAULT_BASE_URL = 'https://api.scadable.com';

/**
 * Fetch the currently published policy for a public token.
 *
 * Works anywhere `fetch` is available. In a Next.js Server Component it uses ISR
 * caching (the `revalidate` option) so the policy is server-rendered and cached,
 * then refreshed, which keeps it both fast and current.
 */
export async function fetchPolicy(token: string, options: FetchPolicyOptions = {}): Promise<Policy> {
  if (!token) {
    throw new Error('@scadable/privacy: a policy token is required');
  }
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
  const docType = options.docType ?? 'privacy_policy';
  const revalidate = options.revalidate ?? 3600;
  const url = `${baseUrl}/policy/${encodeURIComponent(token)}?doc_type=${encodeURIComponent(docType)}&format=json`;

  // `next.revalidate` is honored by Next.js and ignored elsewhere.
  const init: RequestInit =
    revalidate === false
      ? { cache: 'no-store' }
      : ({ next: { revalidate } } as RequestInit);

  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`@scadable/privacy: failed to load policy (${res.status}) for token "${token}"`);
  }
  return (await res.json()) as Policy;
}
