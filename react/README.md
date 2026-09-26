# @scadable/react

Render your always-current SCADABLE privacy policy or terms of use in any React app
(Vite, Create React App, Remix, Gatsby, even a Next.js client component). You publish
the document once in the SCADABLE app; this component shows whatever version is
currently published, pulled live in the browser, so updating it never means a redeploy
on your side.

## Install

```bash
npm install @scadable/react
```

## Use

Give it one thing, your scope's public token, and you are done.

```tsx
import { PrivacyPolicy } from '@scadable/react';

export default function PrivacyPage() {
  return (
    <main>
      <PrivacyPolicy token="YOUR_PUBLIC_TOKEN" />
    </main>
  );
}
```

Terms of use is the same, with its own wrapper:

```tsx
import { TermsOfUse } from '@scadable/react';

export default function TermsPage() {
  return <TermsOfUse token="YOUR_PUBLIC_TOKEN" />;
}
```

Or use the generic component and pick the document with `docType`:

```tsx
import { ScadablePolicy } from '@scadable/react';

export default function Page() {
  return <ScadablePolicy token="YOUR_PUBLIC_TOKEN" docType="terms_of_use" />;
}
```

Get `YOUR_PUBLIC_TOKEN` from the SCADABLE app after you publish a document.

## A published document (tenant)

A document you approve in the SCADABLE app is also published at
`https://files.scadable.com/{tenant}/{document}.html`. Give the tenant in place of the
token; the named components know their document's slug.

```tsx
import { PrivacyPolicy, ScadablePolicy } from '@scadable/react';

<PrivacyPolicy tenant="YOUR_TENANT" />;
<ScadablePolicy tenant="YOUR_TENANT" document="terms-of-use" />;
```

The document is checked before it is rendered (`isAllowedHtml` in `@scadable/core`). One
that is not made only of what a SCADABLE document may contain is not rendered, and a plain
link to it is shown instead. A token and a tenant are one or the other: TypeScript rejects
both together.

## Options

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `token` | `string` | required without a tenant | Your scope's public token. |
| `docType` | `string` | `"privacy_policy"` | Which document to render with a token (`ScadablePolicy` only). |
| `tenant` | `string` | none | Your organization's id in SCADABLE, in place of a token. |
| `document` | `string` | required with a tenant | The published document's slug, for example `"privacy-policy"` (`ScadablePolicy` only). |
| `className` | `string` | none | Class on the wrapper element. |
| `showVersion` | `boolean` | `false` | Show a "Version N, last updated ..." line. Token only. |
| `baseUrl` | `string` | `https://policy.scadable.com`, or `https://files.scadable.com` with a tenant | Override the base. |
| `initialHtml` | `string` | none | Pre-fetched HTML for SSR hosts. See below. With a tenant it is checked like the live copy. |

## Always live

The document is fetched in the browser when the component mounts and injected, so any
edit you publish in SCADABLE shows up on the next page load with no redeploy on your
side. The returned HTML is a self-styled fragment that inherits your page's text color
and already includes the "by scadable.com" backlink. If the browser fetch is blocked
(a strict Content-Security-Policy) or offline, the component keeps whatever is already
shown, so the page is never blank.

## SSR hosts (Remix, Gatsby, Next client)

If your host fetches the document itself during server render or build (for SEO and to
avoid a first-paint flash), pass that HTML as `initialHtml`. The component renders it
immediately, then swaps in the live copy on mount.

```tsx
import { fetchPolicy } from '@scadable/core';
import { PrivacyPolicy } from '@scadable/react';

// In your loader / getStaticProps / server component:
const policy = await fetchPolicy('YOUR_PUBLIC_TOKEN');

// In the component tree:
<PrivacyPolicy token="YOUR_PUBLIC_TOKEN" initialHtml={policy.html} />;
```

This is optional. With no `initialHtml` the component works as a pure client-only SPA
widget and shows a small loading line until the first fetch lands.

## Notes

- This package only talks to the public SCADABLE API. It stores no secrets.
- The rendered HTML is your own published document content from the SCADABLE API.
