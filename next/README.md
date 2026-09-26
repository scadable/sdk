# @scadable/next

Render your always-current legal documents (privacy policy, terms of use, and more) in a
Next.js app. You publish each document once in the SCADABLE app; these components show
whatever version is currently published, so updating a document never means a redeploy on
your side. One thing to provide: your public token.

## Install

```bash
npm install @scadable/next
```

## Use (App Router)

Drop a component on the matching page. Each is a Server Component, so the document text is
server-rendered (good for SEO) and then kept live in the browser.

```tsx
// app/privacy/page.tsx
import { PrivacyPolicy } from '@scadable/next';

export default function PrivacyPage() {
  return (
    <main>
      <PrivacyPolicy token="YOUR_PUBLIC_TOKEN" />
    </main>
  );
}
```

```tsx
// app/terms/page.tsx
import { TermsOfUse } from '@scadable/next';

export default function TermsPage() {
  return (
    <main>
      <TermsOfUse token="YOUR_PUBLIC_TOKEN" />
    </main>
  );
}
```

Get `YOUR_PUBLIC_TOKEN` from the SCADABLE app after you publish a document.

### Any document type

`PrivacyPolicy` and `TermsOfUse` are thin wrappers over a generic `ScadablePolicy`
component. Use it directly to render any document type by setting `docType` (it defaults
to `"privacy_policy"`). A new document type is a prop value, never a new package.

```tsx
import { ScadablePolicy } from '@scadable/next';

export default function Page() {
  return <ScadablePolicy token="YOUR_PUBLIC_TOKEN" docType="terms_of_use" />;
}
```

### How it works (hybrid: SEO + live)

The document is fetched at build / server-render time and baked into the static HTML, so
the legal text and the "by scadable.com" backlink are crawlable for SEO and paint
instantly with no layout shift. It is then re-fetched in the browser, so edits you make in
SCADABLE go live with no redeploy on your side. If a strict Content-Security-Policy blocks
the browser fetch (or the visitor is offline), the baked copy stays put, so the page is
never blank.

### A published document (tenant)

A document you approve in the SCADABLE app is also published at
`https://files.scadable.com/{tenant}/{document}.html`. Give the tenant in place of the
token; the wrappers know their document's slug.

```tsx
import { PrivacyPolicy, ScadablePolicy } from '@scadable/next';

<PrivacyPolicy tenant="YOUR_TENANT" />;
<ScadablePolicy tenant="YOUR_TENANT" document="terms-of-use" />;
```

It is baked and refreshed the same way. The document is checked before it is rendered
(`isAllowedHtml` in `@scadable/core`); one that is not made only of what a SCADABLE
document may contain is not rendered, and a plain link to it is baked instead. A token and
a tenant are one or the other: TypeScript rejects both together.

### Options

These props apply to `PrivacyPolicy`, `TermsOfUse`, and `ScadablePolicy`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `token` | `string` | required without a tenant | Your scope's public token. |
| `tenant` | `string` | none | Your organization's id in SCADABLE, in place of a token. |
| `className` | `string` | none | Class on the wrapper element. |
| `showVersion` | `boolean` | `false` | Show a "Version N, last updated ..." line. Token only. |
| `revalidate` | `number \| false` | `3600` | Next.js ISR seconds. `false` = always fresh. |
| `baseUrl` | `string` | `https://policy.scadable.com`, or `https://files.scadable.com` with a tenant | Override the base. |
| `docType` | `string` | `"privacy_policy"` | Which document to render with a token. Only on `ScadablePolicy` (the wrappers fix it). |
| `document` | `string` | required with a tenant | The published document's slug, for example `"privacy-policy"`. Only on `ScadablePolicy`. |

## Just the data

If you want to render it yourself, the fetch client and types come from `@scadable/core`
and are re-exported here for convenience:

```ts
import { fetchPolicy } from '@scadable/next';

const policy = await fetchPolicy('YOUR_PUBLIC_TOKEN', { docType: 'terms_of_use' });
// { scope_name, domain, doc_type, version, effective_date, updated_at, html }
```

`policy.html` is a self-styled HTML content fragment that inherits the host page's text
color, safe to inject inline. It already includes the "by scadable.com" backlink.

A published document comes from `fetchDocument`, whose `html` is already checked:

```ts
import { fetchDocument, documentSlug } from '@scadable/next';

const doc = await fetchDocument({ tenant: 'YOUR_TENANT', document: documentSlug('terms_of_use') });
// { html, url }
```

## Notes

- This package only talks to the public SCADABLE API. It stores no secrets.
- The rendered HTML is your own published document content from the SCADABLE API.
