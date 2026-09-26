import { documentSlug, fetchDocument, fetchPolicy } from '@scadable/core';
import type { DocumentOwner, DocumentSource } from '@scadable/core';

import { PolicyLive } from './PolicyLive';

/** How the document is fetched and shown, whichever way it is named. */
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
   * Next.js ISR revalidation for the server fetch, in seconds. Pass false to
   * always fetch fresh. Default 3600 (1 hour).
   */
  revalidate?: number | false;
}

/**
 * Which document to render, a `token` with a `docType` or a `tenant` with a
 * `document`, and how to fetch and show it.
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
 * Renders your always-current SCADABLE document for any `docType`.
 *
 * Hybrid by design. The document HTML is fetched at build / server-render time and baked
 * into the static HTML, so the legal text and the "by scadable.com" backlink are
 * crawlable for SEO and paint instantly. It is then re-fetched in the browser (see
 * {@link PolicyLive}) so edits you make in SCADABLE go live with no redeploy on your
 * side. If a strict Content-Security-Policy blocks the browser fetch, the baked copy
 * stays put, so the page is never blank.
 *
 * `docType` defaults to "privacy_policy". Use the {@link PrivacyPolicy} and
 * {@link TermsOfUse} wrappers for the common cases, or set `docType` directly here for
 * any future document type. A document published to files.scadable.com is named by its
 * `tenant` and `document` instead, and is baked only when it passes the allowlist check
 * in @scadable/core (a plain link to it is baked when it does not).
 *
 * ```tsx
 * import { ScadablePolicy } from '@scadable/next';
 *
 * export default function Page() {
 *   return <ScadablePolicy token="YOUR_PUBLIC_TOKEN" docType="terms_of_use" />;
 * }
 * ```
 */
export async function ScadablePolicy(props: ScadablePolicyProps) {
  if (props.tenant !== undefined) {
    const { tenant, document: slug, className, showVersion = false, baseUrl, revalidate } = props;
    let doc;
    try {
      doc = await fetchDocument({ tenant, document: slug }, { baseUrl, revalidate });
    } catch (err) {
      // An unpublished document or a down CDN must never hard-fail the build / SSR.
      console.warn(`[@scadable/next] failed to load document "${slug}" for tenant "${tenant}"`, err);

      if (process.env.NODE_ENV !== 'production') {
        return (
          <div className={className}>
            <p style={{ fontSize: 13, color: '#b91c1c' }}>
              [@scadable/next] Could not load the document &quot;{slug}&quot; for tenant &quot;{tenant}&quot;:{' '}
              {err instanceof Error ? err.message : String(err)}
            </p>
          </div>
        );
      }

      // As with a token: bake nothing and let the browser refresh fill it in.
      return (
        <PolicyLive
          tenant={tenant}
          document={slug}
          initialHtml=""
          className={className}
          showVersion={showVersion}
          baseUrl={baseUrl}
        />
      );
    }

    return (
      <PolicyLive
        tenant={tenant}
        document={slug}
        initialHtml={doc.html}
        className={className}
        showVersion={showVersion}
        baseUrl={baseUrl}
      />
    );
  }

  const { token, className, showVersion = false, docType = 'privacy_policy', ...options } = props;
  let policy;
  try {
    policy = await fetchPolicy(token, { ...options, docType });
  } catch (err) {
    // A bad token or a down API must never hard-fail the customer's build / SSR.
    console.warn(`[@scadable/next] failed to load policy for token "${token}"`, err);

    if (process.env.NODE_ENV !== 'production') {
      // In development, surface the real cause inline so it is obvious what broke.
      return (
        <div className={className}>
          <p style={{ fontSize: 13, color: '#b91c1c' }}>
            [@scadable/next] Could not load the {docType} for token &quot;{token}&quot;:{' '}
            {err instanceof Error ? err.message : String(err)}
          </p>
        </div>
      );
    }

    // In production, render nothing baked and let the browser live-refresh fill it in,
    // so the page still builds and recovers on its own once the API is reachable again.
    return (
      <PolicyLive
        token={token}
        initialHtml=""
        className={className}
        showVersion={showVersion}
        baseUrl={options.baseUrl}
        docType={docType}
      />
    );
  }

  return (
    <PolicyLive
      token={token}
      initialHtml={policy.html}
      initialVersion={policy.version}
      initialUpdatedAt={policy.updated_at}
      className={className}
      showVersion={showVersion}
      baseUrl={options.baseUrl}
      docType={docType}
    />
  );
}
