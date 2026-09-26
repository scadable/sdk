'use client';

import * as React from 'react';

import { documentSlug, fetchDocument, fetchPolicy, isAllowedHtml } from '@scadable/core';
import type { DocumentOwner, DocumentSource, FetchPolicyOptions, Policy } from '@scadable/core';

/** How the document is shown, whichever way it is named. */
interface DisplayProps {
  /** Optional wrapper class so you can style/position the document. */
  className?: string;
  /**
   * Show a small "Version N, last updated ..." line under the document. Default
   * false. Only a token's document has a version to show.
   */
  showVersion?: boolean;
  /**
   * Override the base. Default "https://policy.scadable.com" for a token and
   * "https://files.scadable.com" for a tenant.
   */
  baseUrl?: string;
  /**
   * HTML you already fetched (a host that did its own SSR or build-time fetch can
   * pass it). It renders immediately, so the legal text and the "by scadable.com"
   * backlink are crawlable for SEO with no flash, then the live copy is swapped in
   * on mount. Omit it for a pure client-only SPA. With a tenant it is shown only
   * when it passes the same allowlist check as the live copy.
   */
  initialHtml?: string;
}

/**
 * Which document to render, a `token` with a `docType` or a `tenant` with a
 * `document`, and how to show it.
 */
export type ScadablePolicyProps = DocumentSource & DisplayProps;

/** Props of a component that fixes its document: a `token` or a `tenant`. */
export type NamedDocumentProps = DocumentOwner & DisplayProps;

/**
 * A named component's props, pointed at its document: the document type for a
 * token, and the slug that type is published under for a tenant.
 */
export function forDocType(props: NamedDocumentProps, docType: string): ScadablePolicyProps {
  return props.tenant !== undefined ? { ...props, document: documentSlug(docType) } : { ...props, docType };
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
 * Name the document with a `token` and a `docType`, or with the `tenant` and
 * `document` of a document published to files.scadable.com. A published document
 * is inserted only when it passes the allowlist check in @scadable/core, and is a
 * plain link to where it is published when it does not.
 *
 * ```tsx
 * import { ScadablePolicy } from '@scadable/react';
 *
 * export default function Page() {
 *   return <ScadablePolicy token="YOUR_PUBLIC_TOKEN" docType="terms_of_use" />;
 * }
 * ```
 */
export function ScadablePolicy(props: ScadablePolicyProps) {
  const { className, showVersion = false, baseUrl, initialHtml } = props;
  // Read off props rather than destructured: `document` would shadow the DOM global.
  const token = props.token;
  const docType = props.docType ?? 'privacy_policy';
  const tenant = props.tenant;
  const slug = props.document;

  const [html, setHtml] = React.useState<string | undefined>(() =>
    tenant !== undefined && initialHtml !== undefined && !isAllowedHtml(initialHtml) ? undefined : initialHtml,
  );
  const [version, setVersion] = React.useState<number | undefined>(undefined);
  const [updatedAt, setUpdatedAt] = React.useState<string | null>(null);
  const [errored, setErrored] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    // Keep whatever is shown (initialHtml or the loading line) if the browser
    // fetch is blocked (CSP), offline, or the token/API is bad, but make the
    // failure visible: warn and mark the node so it is debuggable.
    const fail = (what: string) => (err: unknown) => {
      if (alive) setErrored(true);
      console.warn(`[@scadable/react] failed to load ${what}`, err);
    };

    if (tenant !== undefined) {
      fetchDocument({ tenant, document: slug ?? '' }, { baseUrl, revalidate: false })
        .then((doc) => {
          if (!alive || !doc.html) return;
          setHtml(doc.html);
          setErrored(false);
        })
        .catch(fail(`document "${slug}" for tenant "${tenant}"`));
    } else {
      const opts: FetchPolicyOptions = { docType, revalidate: false };
      if (baseUrl) opts.baseUrl = baseUrl;
      fetchPolicy(token ?? '', opts)
        .then((p: Policy) => {
          if (!alive || !p?.html) return;
          setHtml(p.html);
          setVersion(p.version);
          setUpdatedAt(p.updated_at);
          setErrored(false);
        })
        .catch(fail(`policy for token "${token}"`));
    }
    return () => {
      alive = false;
    };
  }, [token, docType, tenant, slug, baseUrl]);

  return (
    <div className={className} data-scadable-error={errored ? 'true' : undefined}>
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
