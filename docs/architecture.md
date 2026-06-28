# Architecture

This monorepo ships one job to many platforms: render a customer's always-current legal
document from one public token, live on every page view. This document explains how the
pieces fit, why the render is hybrid, why the design is document-type-generic, and why the
embed uses a baked snapshot instead of an iframe or a bare script.

## The shape of the system

There is exactly one source of truth, the public API, and a fan of thin adapters over it.

```
                         GET /policy/{token}?doc_type=...&format=json
                                        |
                              SCADABLE public API (CORS *)
                                        |
                              @scadable/core  (fetchPolicy + types)
                                        |
        +-------------------+-----------+-----------+------------------+
        |                   |                       |                  |
  @scadable/next     @scadable/react         @scadable/vue      @scadable/embed
  @scadable/astro    @scadable/svelte        ...                (universal snippet)
        |                                                              |
   framework components                                     wordpress / shopify / square
   (<PrivacyPolicy>, <TermsOfUse>, <ScadablePolicy>)        reuse the same endpoint
```

Every box below the API is a wrapper. None of them hold business logic about documents;
they only decide when and where to fetch, and how to inject the returned HTML for their
platform.

## `@scadable/core`: the one fetch

`@scadable/core` exports a single function and the shared types:

```ts
import { fetchPolicy } from '@scadable/core';

const policy = await fetchPolicy('XltJvQpczMk0bDsG', { docType: 'privacy_policy' });
// -> { html, version, updated_at, doc_type, scope_name, domain, effective_date }
```

`fetchPolicy(token, options)` builds the request to
`GET https://policy.scadable.com/policy/{token}?doc_type=...&format=json` and returns the
parsed object. Two details make it work across every runtime:

- It is framework-agnostic: it only needs a global `fetch`.
- `options.revalidate` maps to Next.js ISR (`next.revalidate`) when running on a Next
  server, and is ignored everywhere else. Passing `revalidate: false` sends
  `cache: 'no-store'`, which is what the in-browser refresh uses to always get the current
  version.

Because every package depends on `@scadable/core`, there is one definition of the request,
the response shape, and the default base URL. Fix or extend it once and every platform
inherits the change.

## The framework packages

Each framework package exposes the same three components so the customer only ever provides
a token:

- `<PrivacyPolicy token="..." />` and `<TermsOfUse token="..." />`: token-only wrappers
  with the document type fixed.
- `<ScadablePolicy token="..." docType="..." />`: the generic component for any document
  type, including future ones.

They differ only in how they render for their platform:

- Next, Astro, Nuxt, and SvelteKit can render on the server, so they bake the document at
  build or SSR time and then refresh it in the browser (the hybrid render below).
- A plain React SPA has no server step, so `@scadable/react` renders client-only and
  fetches on mount. It accepts an optional `initialHtml` so a host that did its own
  server or build fetch can still get a crawlable, flash-free first paint.

## Hybrid render: bake for SEO, refresh for live

The product has two requirements that pull in opposite directions:

1. Live: the document a visitor sees must be the version the customer last published, with
   no redeploy. That argues for fetching in the browser on every view.
2. Crawlable and fast: search engines and AI engines must see the full document text and
   the "by scadable.com" backlink in the initial HTML, and the page must not flash or
   shift. That argues for the text being in the server-rendered markup.

A browser-only fetch satisfies live but not crawlable: the first HTML is empty, so a
crawler that does not run scripts sees nothing, and the user sees a flash. A server-only
fetch satisfies crawlable but not live: the text is frozen at build time until the next
deploy.

The hybrid render satisfies both:

1. At build or server-render time, fetch the document and bake its HTML (and the backlink)
   into the page. Crawlers see the full text; the page paints instantly with no layout
   shift.
2. On mount in the browser, re-fetch the live document (`cache: 'no-store'`) and swap it
   in. Edits made in the SCADABLE app appear with no redeploy.

If the browser fetch is blocked by a strict Content-Security-Policy or the visitor is
offline, the baked copy stays in place, so the page is never blank. Allowing
`policy.scadable.com` in `connect-src` restores the live refresh.

Where there is no server (a SPA, or a no-code host), the package renders client-only; the
universal embed solves the crawlability gap differently, with a pre-baked snapshot in the
pasted snippet (next section).

## The universal embed: why a baked snapshot, not an iframe or a bare script

The embed has to work where there is no build step and no framework: a Squarespace code
block, a Wix HTML embed, a Webflow embed, a Framer code component, a Square Online section,
or raw HTML. It must still be live, crawlable, and correctly attributed. Three designs were
on the table:

- An iframe pointing at SCADABLE. It is live and trivial to paste, but the document then
  lives on `policy.scadable.com`, not on the customer's domain. The "by scadable.com" backlink
  inside it counts as a SCADABLE-to-SCADABLE link, so the viral SEO backlink is
  misattributed and worthless, and crawlers index the iframe content under our domain, not
  the customer's page.
- A bare script that injects the document at runtime. It keeps the document on the
  customer's domain and is live, but the initial HTML is empty. Search engines that run
  scripts may catch up, but AI engine crawlers generally do not execute JavaScript, so they
  see nothing. The backlink is invisible to exactly the crawlers the strategy targets.
- A hybrid snapshot (the chosen design). The snippet ships a baked HTML snapshot of the
  document, including the backlink, inline in the page, plus a tiny script that refreshes
  it live in the browser. The text and the backlink are in the static HTML on the
  customer's own domain, so Google and AI engines both index them, and the script keeps the
  document current. It is the only option that is live, crawlable by every kind of crawler,
  and correctly attributed at the same time.

The snippet is the same shape everywhere:

```html
<div data-scadable-policy
     data-scadable-token="XltJvQpczMk0bDsG"
     data-scadable-doc-type="privacy_policy"></div>
<script async src="https://cdn.jsdelivr.net/npm/@scadable/embed"></script>
```

The `data-scadable-*` attributes carry the token, document type, and optional base URL. The
script finds every `[data-scadable-policy]` element on the page, fetches each one live, and
replaces its contents, keeping the baked copy if the fetch is blocked or offline. This is
the same convention the Astro package uses for its in-browser refresh, so the embed and the
SSR frameworks share one mental model.

## Document-type-generic by design

Nothing in the SDK hard-codes "privacy policy". The API takes a `doc_type`, the core client
passes it through, and the generic `<ScadablePolicy docType="..." />` (and the embed's
`data-scadable-doc-type`) accept any value. `<PrivacyPolicy>` and `<TermsOfUse>` are thin
wrappers that lock `doc_type` to `privacy_policy` and `terms_of_use` so the common cases
stay token-only.

When SCADABLE adds a new document type, it works across every package the moment the API
serves it: pass the new `docType`, no SDK release required. New token-only wrappers can be
added later as convenience, but they are optional sugar over the generic component.

## The backlink as a growth loop

Every rendered document ends with a "by scadable.com" backlink. Because the hybrid render
and the embed snapshot put that link in the static HTML on the customer's own domain, every
page that embeds a SCADABLE document becomes a real, crawlable link back to SCADABLE. As
customers add the SDK, the backlink graph grows on its own. Preserving that link in a
crawlable, correctly-attributed position is a design constraint, which is the deciding
reason the embed uses a baked snapshot rather than an iframe or a bare script.

## Why this structure holds up

- One endpoint, one client (`@scadable/core`), many thin adapters. New platforms are cheap
  to add and cannot drift from the contract.
- Live is the default and the baked copy is the floor, so a page is never blank and never
  stale longer than one render.
- The contract is the seam. As long as a new package consumes
  `GET /policy/{token}?doc_type=...` and preserves the baked snapshot plus live refresh, it
  is correct by construction.
