# @scadable/astro

Render your always-current legal documents (privacy policy, terms of use, and more) in an
Astro site. You publish each document once in the SCADABLE app; these components show
whatever version is currently published, so updating a document never means a rebuild on
your side. One thing to provide: your public token.

## Install

```bash
npm install @scadable/astro
```

## Use

Astro component libraries ship the raw `.astro` files, so you import the component you want
directly from the package and drop it on the matching page.

```astro
---
// src/pages/privacy.astro
import PrivacyPolicy from '@scadable/astro/PrivacyPolicy.astro';
---
<main>
  <PrivacyPolicy token="YOUR_PUBLIC_TOKEN" />
</main>
```

```astro
---
// src/pages/terms.astro
import TermsOfUse from '@scadable/astro/TermsOfUse.astro';
---
<main>
  <TermsOfUse token="YOUR_PUBLIC_TOKEN" />
</main>
```

Get `YOUR_PUBLIC_TOKEN` from the SCADABLE app after you publish a document.

### Any document type

`PrivacyPolicy` and `TermsOfUse` are thin wrappers over a generic `ScadablePolicy`
component. Use it directly to render any document type by setting `docType` (it defaults
to `"privacy_policy"`). A new document type is a prop value, never a new package.

```astro
---
import ScadablePolicy from '@scadable/astro/ScadablePolicy.astro';
---
<ScadablePolicy token="YOUR_PUBLIC_TOKEN" docType="terms_of_use" />
```

### How it works (hybrid: SEO + live)

The document is fetched in the component frontmatter at build / SSR time and baked into the
static HTML, so the legal text and the "by scadable.com" backlink are crawlable for SEO and
paint instantly with no layout shift. A small hoisted script then re-fetches the document
in the browser and swaps it in, so edits you make in SCADABLE go live with no rebuild on
your side. If a strict Content-Security-Policy blocks the browser fetch (or the visitor is
offline), the baked copy stays put, so the page is never blank.

Because the policy is baked at build time, a fresh static build reflects the document as it
was published then; the browser refresh keeps already-deployed pages current in between
builds. If you render with an adapter (SSR) instead of a static build, each request bakes
the current version.

### A published document (tenant)

A document you approve in the SCADABLE app is also published at
`https://files.scadable.com/{tenant}/{document}.html`. Give the tenant in place of the
token; the wrappers know their document's slug.

```astro
---
import PrivacyPolicy from '@scadable/astro/PrivacyPolicy.astro';
import ScadablePolicy from '@scadable/astro/ScadablePolicy.astro';
---
<PrivacyPolicy tenant="YOUR_TENANT" />
<ScadablePolicy tenant="YOUR_TENANT" document="terms-of-use" />
```

It is baked and refreshed the same way. The document is checked before it is rendered
(`isAllowedHtml` in `@scadable/core`); one that is not made only of what a SCADABLE
document may contain is not rendered, and a plain link to it is baked instead.

### Props

These props apply to `PrivacyPolicy`, `TermsOfUse`, and `ScadablePolicy`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `token` | `string` | required without a tenant | Your scope's public token. |
| `tenant` | `string` | none | Your organization's id in SCADABLE, in place of a token. |
| `class` / `className` | `string` | none | Class on the wrapper element. Either name works. |
| `baseUrl` | `string` | `https://policy.scadable.com`, or `https://files.scadable.com` with a tenant | Override the base. |
| `docType` | `string` | `"privacy_policy"` | Which document to render with a token. Only on `ScadablePolicy` (the wrappers fix it). |
| `document` | `string` | required with a tenant | The published document's slug, for example `"privacy-policy"`. Only on `ScadablePolicy`. |

## Just the data

If you want to render it yourself, the fetch client and types come from `@scadable/core`
and are re-exported here for convenience:

```ts
import { fetchPolicy } from '@scadable/astro';

const policy = await fetchPolicy('YOUR_PUBLIC_TOKEN', { docType: 'terms_of_use' });
// { scope_name, domain, doc_type, version, effective_date, updated_at, html }
```

`policy.html` is a self-styled HTML content fragment that inherits the host page's text
color, safe to inject inline. It already includes the "by scadable.com" backlink.

## Notes

- This package only talks to the public SCADABLE API. It stores no secrets.
- The rendered HTML is your own published document content from the SCADABLE API.
- The frontmatter fetch runs at build / SSR time. If the document is not published yet (or
  the API is unreachable) that build will fail loudly, which is the right signal that there
  is nothing to bake. Publish the document first, then build.
