import type { FetchPolicyOptions, Policy } from './types';

export const DEFAULT_BASE_URL = 'https://policy.scadable.com';

/**
 * Fetch the currently published document for a public token.
 *
 * Framework-agnostic: works anywhere `fetch` is available. In a Next.js Server
 * Component it uses ISR caching via `next.revalidate` (ignored elsewhere). Pass
 * `revalidate: false` for an always-fresh browser fetch.
 */
export async function fetchPolicy(token: string, options: FetchPolicyOptions = {}): Promise<Policy> {
  if (!token) {
    throw new Error('@scadable/core: a policy token is required');
  }
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
  const docType = options.docType ?? 'privacy_policy';
  const revalidate = options.revalidate ?? 3600;
  const url = `${baseUrl}/policy/${encodeURIComponent(token)}?doc_type=${encodeURIComponent(docType)}&format=json`;

  // `next.revalidate` is honored by Next.js and ignored by every other runtime.
  const init: RequestInit =
    revalidate === false
      ? { cache: 'no-store' }
      : ({ next: { revalidate } } as RequestInit);

  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`@scadable/core: failed to load document (${res.status}) for token "${token}"`);
  }
  return (await res.json()) as Policy;
}
