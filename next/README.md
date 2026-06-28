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

### Options

These props apply to `PrivacyPolicy`, `TermsOfUse`, and `ScadablePolicy`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `token` | `string` | required | Your scope's public token. |
| `className` | `string` | none | Class on the wrapper element. |
| `showVersion` | `boolean` | `false` | Show a "Version N, last updated ..." line. |
| `revalidate` | `number \| false` | `3600` | Next.js ISR seconds. `false` = always fresh. |
| `baseUrl` | `string` | `https://api.scadable.com` | Override the API base. |
| `docType` | `string` | `"privacy_policy"` | Which document to render. Only on `ScadablePolicy` (the wrappers fix it). |

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

## Notes

- This package only talks to the public SCADABLE API. It stores no secrets.
- The rendered HTML is your own published document content from the SCADABLE API.
