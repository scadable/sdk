'use client';

import * as React from 'react';

import { fetchPolicy } from '@scadable/core';
import type { FetchPolicyOptions, Policy } from '@scadable/core';

export interface ScadablePolicyProps {
  /** The public token from the SCADABLE app. */
  token: string;
  /** Which document to render. Default "privacy_policy". */
  docType?: string;
  /** Optional wrapper class so you can style/position the document. */
  className?: string;
  /** Show a small "Version N, last updated ..." line under the document. Default false. */
  showVersion?: boolean;
  /** Override the API base. Default "https://policy.scadable.com". */
  baseUrl?: string;
  /**
   * HTML you already fetched (a host that did its own SSR or build-time fetch can
   * pass it). It renders immediately, so the legal text and the "by scadable.com"
   * backlink are crawlable for SEO with no flash, then the live copy is swapped in
   * on mount. Omit it for a pure client-only SPA.
   */
  initialHtml?: string;
}

/**
 * Renders your always-current SCADABLE document (privacy policy, terms of use, or
 * any future type) in any React app.
 *
 * Live by design. The document is fetched in the browser on mount and injected, so
 * edits you make in SCADABLE go live with no redeploy on your side. Pass
 * `initialHtml` (from a host-side SSR or build fetch) and it paints that instantly
 * and stays crawlable, then re-fetches the live copy. With no `initialHtml` it shows
 * a small loading line until the first fetch lands. If the browser fetch is blocked
 * (a strict Content-Security-Policy) or offline, it keeps whatever is already shown,
 * so the page is never blank.
 *
 * ```tsx
 * import { ScadablePolicy } from '@scadable/react';
 *
 * export default function Page() {
 *   return <ScadablePolicy token="YOUR_PUBLIC_TOKEN" docType="terms_of_use" />;
 * }
 * ```
 */
export function ScadablePolicy({
  token,
  docType = 'privacy_policy',
  className,
  showVersion = false,
  baseUrl,
  initialHtml,
}: ScadablePolicyProps) {
  const [html, setHtml] = React.useState<string | undefined>(initialHtml);
  const [version, setVersion] = React.useState<number | undefined>(undefined);
  const [updatedAt, setUpdatedAt] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    const opts: FetchPolicyOptions = { docType, revalidate: false };
    if (baseUrl) opts.baseUrl = baseUrl;
    fetchPolicy(token, opts)
      .then((p: Policy) => {
        if (!alive || !p?.html) return;
        setHtml(p.html);
        setVersion(p.version);
        setUpdatedAt(p.updated_at);
      })
      .catch(() => {
        /* keep whatever is shown (initialHtml or the loading line) if the browser
           fetch is blocked (CSP) or offline */
      });
    return () => {
      alive = false;
    };
  }, [token, docType, baseUrl]);

  return (
    <div className={className}>
      {html !== undefined ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p style={{ fontSize: 12, color: '#9ca3af' }}>Loading…</p>
      )}
      {showVersion && updatedAt ? (
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 24 }}>
          Version {version}. Last updated {new Date(updatedAt).toLocaleDateString()}.
        </p>
      ) : null}
    </div>
  );
}
