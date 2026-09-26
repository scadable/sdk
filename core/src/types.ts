export interface Policy {
  /** The name you gave the scope (your company / site). */
  scope_name: string;
  domain: string;
  /** "privacy_policy", "terms_of_use", or any future document type. */
  doc_type: string;
  /** The published version number that is currently live. */
  version: number;
  effective_date: string;
  /** ISO timestamp of when this version was published, or null. */
  updated_at: string | null;
  /** The rendered document as an HTML content fragment (no <html> wrapper). */
  html: string;
}

export interface FetchPolicyOptions {
  /** Which document to fetch. Default "privacy_policy". */
  docType?: string;
  /** Override the API base. Default "https://policy.scadable.com". */
  baseUrl?: string;
  /**
   * Next.js ISR revalidation, in seconds (honored by Next, ignored elsewhere).
   * Pass false to always fetch fresh (cache: "no-store") - what the browser
   * refresh uses to stay current. Default 3600 (1 hour) for server/build fetches.
   */
  revalidate?: number | false;
}

/**
 * A published document, named the way its URL names it:
 * `https://files.scadable.com/{tenant}/{document}.html`.
 */
export interface DocumentRef {
  /** Your organization's id in SCADABLE, the first segment of the document's URL. */
  tenant: string;
  /** The document's slug, its file name without `.html`, for example "privacy-policy". */
  document: string;
}

export interface FetchDocumentOptions {
  /** Override the base the document is published under. Default "https://files.scadable.com". */
  baseUrl?: string;
  /** The same as `FetchPolicyOptions.revalidate`: ISR seconds, or false for an always-fresh fetch. */
  revalidate?: number | false;
}

export interface PublishedDocument {
  /**
   * HTML that is safe to insert into your page: the document itself when it is
   * made only of what a SCADABLE document may contain, otherwise a plain link to
   * `url`. Never anything else.
   */
  html: string;
  /** Where the document is published. */
  url: string;
}

/**
 * Which document a component renders: a public token and a document type (the
 * original path), or a tenant and a document slug (a document published to
 * files.scadable.com). Exactly one of the two.
 */
export type DocumentSource =
  | { token: string; docType?: string; tenant?: never; document?: never }
  | { tenant: string; document: string; token?: never; docType?: never };

/**
 * Whose document a component renders when the component already fixes which
 * document it is (PrivacyPolicy, TermsOfUse, CookiePolicy, Imprint): a public
 * token or a tenant. Exactly one of the two.
 */
export type DocumentOwner = { token: string; tenant?: never } | { tenant: string; token?: never };
