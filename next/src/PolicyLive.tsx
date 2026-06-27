'use client';

import * as React from 'react';

import { fetchPolicy } from './client';
import type { FetchPolicyOptions } from './types';

export interface PolicyLiveProps {
  /** The public token from the SCADABLE app. */
  token: string;
  /** HTML baked in at build / server-render time, so it is crawlable and paints instantly. */
  initialHtml: string;
  initialVersion?: number;
  initialUpdatedAt?: string | null;
  /** Optional wrapper class so you can style/position the policy. */
  className?: string;
  /** Show a small "Version N, last updated ..." line under the policy. Default false. */
  showVersion?: boolean;
  /** Override the API base (forwarded to the browser fetch). */
  baseUrl?: string;
  /** Which document to fetch (forwarded to the browser fetch). */
  docType?: string;
}

/**
 * The client half of <PrivacyPolicy>. It renders the build-time HTML immediately, so
 * the legal text and the "by scadable.com" backlink are in the static HTML (crawlable
 * for SEO, no layout shift), then re-fetches the live policy in the browser so edits
 * made in SCADABLE show up with no redeploy on the customer's side. If the browser
 * fetch is blocked (a strict Content-Security-Policy) or offline, it keeps the baked
 * copy, so the page is never blank.
 */
export function PolicyLive({
  token,
  initialHtml,
  initialVersion,
  initialUpdatedAt,
  className,
  showVersion = false,
  baseUrl,
  docType,
}: PolicyLiveProps) {
  const [html, setHtml] = React.useState(initialHtml);
  const [version, setVersion] = React.useState(initialVersion);
  const [updatedAt, setUpdatedAt] = React.useState<string | null>(initialUpdatedAt ?? null);

  React.useEffect(() => {
    let alive = true;
    const opts: FetchPolicyOptions = { revalidate: false };
    if (baseUrl) opts.baseUrl = baseUrl;
    if (docType) opts.docType = docType;
    fetchPolicy(token, opts)
      .then((p) => {
        if (!alive || !p?.html) return;
        setHtml(p.html);
        setVersion(p.version);
        setUpdatedAt(p.updated_at);
      })
      .catch(() => {
        /* keep the baked copy if the browser fetch is blocked (CSP) or offline */
      });
    return () => {
      alive = false;
    };
  }, [token, baseUrl, docType]);

  return (
    <div className={className}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {showVersion && updatedAt ? (
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 24 }}>
          Version {version}. Last updated {new Date(updatedAt).toLocaleDateString()}.
        </p>
      ) : null}
    </div>
  );
}
