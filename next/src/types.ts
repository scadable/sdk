export interface Policy {
  /** The name you gave the scope (your company / site). */
  scope_name: string;
  domain: string;
  /** "privacy_policy" today; more document types later. */
  doc_type: string;
  /** The published version number that is currently live. */
  version: number;
  effective_date: string;
  /** ISO timestamp of when this version was published, or null. */
  updated_at: string | null;
  /** The rendered policy as an HTML content fragment (no <html> wrapper). */
  html: string;
}

export interface FetchPolicyOptions {
  /** Which document to fetch. Default "privacy_policy". */
  docType?: string;
  /** Override the API base. Default "https://api.scadable.com". */
  baseUrl?: string;
  /**
   * Next.js ISR revalidation, in seconds. The policy is server-rendered and
   * cached for this long, then refreshed, so it stays current without a fetch
   * on every request. Pass false to always fetch fresh. Default 3600 (1 hour).
   */
  revalidate?: number | false;
}
