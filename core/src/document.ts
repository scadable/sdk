import { isAllowedHtml, linkTo } from './allowlist';
import type { DocumentRef, FetchDocumentOptions, PublishedDocument } from './types';

/** Where SCADABLE publishes documents: `{base}/{tenant}/{document}.html`. */
export const DEFAULT_DOCUMENT_BASE_URL = 'https://files.scadable.com';

// Checked before either value is put in a URL, so neither can add a path
// segment, climb one with `..`, or carry a query.
const TENANT = /^[A-Za-z0-9_-]{1,128}$/;
const DOCUMENT = /^[a-z0-9][a-z0-9-]*$/;

const HTML = /^text\/html[\t ]*(?:;|$)/i;

/**
 * The slug a document type is published under: `privacy_policy` is
 * `privacy-policy`. What the named components use to find their document.
 */
export function documentSlug(docType: string): string {
  return docType.replace(/_/g, '-');
}

/**
 * The URL a document is published at. Throws when the tenant or the document is
 * not an id, or when the base is not an http or https URL.
 */
export function documentUrl(ref: DocumentRef, options: Pick<FetchDocumentOptions, 'baseUrl'> = {}): string {
  const { tenant, document: slug } = ref;
  if (typeof tenant !== 'string' || !TENANT.test(tenant)) {
    throw new Error(`@scadable/core: ${JSON.stringify(tenant)} is not a tenant id`);
  }
  if (typeof slug !== 'string' || !DOCUMENT.test(slug)) {
    throw new Error(`@scadable/core: ${JSON.stringify(slug)} is not a document slug (for example "privacy-policy")`);
  }
  const base = trimTrailingSlashes(options.baseUrl ?? DEFAULT_DOCUMENT_BASE_URL);
  let protocol = '';
  try {
    protocol = new URL(base).protocol;
  } catch {
    // Refused below with the same message as any other base that is not http(s).
  }
  if (protocol !== 'https:' && protocol !== 'http:') {
    throw new Error(`@scadable/core: ${JSON.stringify(base)} is not an http or https base URL`);
  }
  return `${base}/${tenant}/${slug}.html`;
}

/**
 * Fetch a document published to files.scadable.com, as HTML that is safe to
 * insert.
 *
 * The document is returned only when it is made of what a SCADABLE document may
 * contain (see `isAllowedHtml`). When it is not, it is refused, a warning says so,
 * and `html` is a plain link to `url` instead. Rejects when the tenant or document
 * is not an id, when the request fails, or when the response is not text/html.
 *
 * Framework-agnostic in the same way as `fetchPolicy`, and `revalidate` means the
 * same thing: ISR seconds on a Next.js server, or false for an always-fresh fetch.
 */
export async function fetchDocument(ref: DocumentRef, options: FetchDocumentOptions = {}): Promise<PublishedDocument> {
  const url = documentUrl(ref, options);
  const revalidate = options.revalidate ?? 3600;

  // `next.revalidate` is honored by Next.js and ignored by every other runtime.
  const init: RequestInit =
    revalidate === false
      ? { cache: 'no-store' }
      : ({ next: { revalidate } } as RequestInit);

  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`@scadable/core: failed to load ${url} (${res.status})`);
  }
  const type = res.headers.get('content-type') ?? '';
  if (!HTML.test(type)) {
    throw new Error(`@scadable/core: ${url} is ${type ? JSON.stringify(type) : 'untyped'}, not text/html`);
  }
  const html = await res.text();
  if (isAllowedHtml(html)) {
    return { html, url };
  }
  console.warn(
    `[@scadable/core] ${url} contains HTML a SCADABLE document may not, so it was not inserted. Showing a link to it instead.`,
  );
  return { html: linkTo(url, ref.document), url };
}

/** Drops trailing `/`s with a loop rather than `/\/+$/`, which is quadratic on a long
 * run of slashes followed by anything else (CodeQL js/polynomial-redos). */
function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value.charCodeAt(end - 1) === 47) end -= 1;
  return value.slice(0, end);
}
