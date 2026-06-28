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
  /** Override the API base. Default "https://api.scadable.com". */
  baseUrl?: string;
  /**
   * Next.js ISR revalidation, in seconds (honored by Next, ignored elsewhere).
   * Pass false to always fetch fresh (cache: "no-store") - what the browser
   * refresh uses to stay current. Default 3600 (1 hour) for server/build fetches.
   */
  revalidate?: number | false;
}
