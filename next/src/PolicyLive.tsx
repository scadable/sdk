'use client';

import * as React from 'react';

import { fetchDocument, fetchPolicy, isAllowedHtml } from '@scadable/core';
import type { DocumentSource, FetchPolicyOptions } from '@scadable/core';

/** The same `token` and `docType`, or `tenant` and `document`, the server half baked. */
export type PolicyLiveProps = DocumentSource & {
  /** HTML baked in at build / server-render time, so it is crawlable and paints instantly. */
  initialHtml: string;
  initialVersion?: number;
  initialUpdatedAt?: string | null;
  /** Optional wrapper class so you can style/position the policy. */
  className?: string;
  /** Show a small "Version N, last updated ..." line under the policy. Default false. */
  showVersion?: boolean;
  /** Override the base (forwarded to the browser fetch). */
  baseUrl?: string;
};

/**
 * The client half shared by <ScadablePolicy>, <PrivacyPolicy>, and <TermsOfUse>. It
 * renders the build-time HTML immediately, so the legal text and the "by scadable.com"
 * backlink are in the static HTML (crawlable for SEO, no layout shift), then re-fetches
 * the live document (for the same `docType`, or the same `tenant` and `document`) in the
 * browser so edits made in SCADABLE show up with no redeploy on the customer's side. If
 * the browser fetch is blocked (a strict Content-Security-Policy) or offline, it keeps
 * the baked copy, so the page is never blank. With a tenant, the baked HTML is shown only
 * when it passes the same allowlist check as the live copy.
 */
export function PolicyLive(props: PolicyLiveProps) {
  const { initialHtml, initialVersion, initialUpdatedAt, className, showVersion = false, baseUrl } = props;
  // Read off props rather than destructured: `document` would shadow the DOM global.
  const token = props.token;
  const docType = props.docType;
  const tenant = props.tenant;
  const slug = props.document;

  const [html, setHtml] = React.useState(() =>
    tenant !== undefined && !isAllowedHtml(initialHtml) ? '' : initialHtml,
  );
  const [version, setVersion] = React.useState(initialVersion);
  const [updatedAt, setUpdatedAt] = React.useState<string | null>(initialUpdatedAt ?? null);

  React.useEffect(() => {
    let alive = true;
    const keepBaked = () => {
      /* keep the baked copy if the browser fetch is blocked (CSP) or offline */
    };
    if (tenant !== undefined) {
      fetchDocument({ tenant, document: slug ?? '' }, { baseUrl, revalidate: false })
        .then((doc) => {
          if (!alive || !doc.html) return;
          setHtml(doc.html);
        })
        .catch(keepBaked);
    } else {
      const opts: FetchPolicyOptions = { revalidate: false };
      if (baseUrl) opts.baseUrl = baseUrl;
      if (docType) opts.docType = docType;
      fetchPolicy(token ?? '', opts)
        .then((p) => {
          if (!alive || !p?.html) return;
          setHtml(p.html);
          setVersion(p.version);
          setUpdatedAt(p.updated_at);
        })
        .catch(keepBaked);
    }
    return () => {
      alive = false;
    };
  }, [token, baseUrl, docType, tenant, slug]);

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
