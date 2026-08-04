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
  // THE PATH IS /v1/policy, AND /policy IS SOMEBODY ELSE'S SERVICE.
  //
  // `policy.scadable.com/policy/{token}` is proxied to the legacy Python service,
  // which has never heard of a token minted by the current one: every component
  // built on this file answered 404 for every document published since the
  // migration. The origin is shared by design (that is what kept older embeds
  // working); the version prefix is what says which store to ask.
  //
  // The trailing `/v1` is stripped as well as a trailing slash, because a base
  // URL ending in the prefix was the documented workaround while this bug was
  // open. Someone who took that advice and later upgraded this package would
  // otherwise request `/v1/v1/policy/...` and get a 404 from the fix itself.
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL)
    .replace(/\/$/, '')
    .replace(/\/v1$/, '');
  const docType = options.docType ?? 'privacy_policy';
  const revalidate = options.revalidate ?? 3600;
  const url = `${baseUrl}/v1/policy/${encodeURIComponent(token)}?doc_type=${encodeURIComponent(docType)}&format=json`;

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
