# @scadable/svelte

Render your always-current privacy policy or terms of use in a Svelte or SvelteKit
app. You publish the document once in the SCADABLE app; these components show
whatever version is currently published, so updating it never means a redeploy on
your side. One thing to provide: your public token.

## Install

```bash
npm install @scadable/svelte
```

This package ships raw `.svelte` source, so your Svelte/SvelteKit/Vite build
compiles it alongside your own components. Requires Svelte 4 or 5.

## Use (Svelte)

Give it your public token and you are done. The document is pulled live when the
component mounts.

```svelte
<script>
  import { PrivacyPolicy } from '@scadable/svelte';
</script>

<PrivacyPolicy token="YOUR_PUBLIC_TOKEN" />
```

Terms of use is the same, with `TermsOfUse`:

```svelte
<script>
  import { TermsOfUse } from '@scadable/svelte';
</script>

<TermsOfUse token="YOUR_PUBLIC_TOKEN" />
```

Get `YOUR_PUBLIC_TOKEN` from the SCADABLE app after you publish a document.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `token` | `string` | required | Your scope's public token. |
| `class` | `string` | none | Class on the wrapper element. |
| `initialHtml` | `string` | none | HTML to render before the live fetch resolves (used for SSR, see below). |

`ScadablePolicy` is the same component with one extra prop, `docType`
(`"privacy_policy"` by default, or `"terms_of_use"`). `PrivacyPolicy` and
`TermsOfUse` are just `ScadablePolicy` with `docType` locked in, so a new document
type is a prop value, never a new package.

```svelte
<script>
  import { ScadablePolicy } from '@scadable/svelte';
</script>

<ScadablePolicy token="YOUR_PUBLIC_TOKEN" docType="terms_of_use" />
```

## SvelteKit (SSR)

For SEO you want the legal text and the "by scadable.com" backlink in the
server-rendered HTML. Fetch the document in a `load` function and pass it as
`initialHtml`; the component renders it on the server, then refreshes live in the
browser so published edits appear with no redeploy.

```ts
// src/routes/privacy/+page.server.ts
import { fetchPolicy } from '@scadable/svelte';

export async function load() {
  const policy = await fetchPolicy('YOUR_PUBLIC_TOKEN', { docType: 'privacy_policy' });
  return { initialHtml: policy.html };
}
```

```svelte
<!-- src/routes/privacy/+page.svelte -->
<script>
  import { PrivacyPolicy } from '@scadable/svelte';
  export let data;
</script>

<PrivacyPolicy token="YOUR_PUBLIC_TOKEN" initialHtml={data.initialHtml} />
```

## Live behavior

- Plain Svelte (Vite SPA): the document is fetched in the browser on mount.
- SvelteKit (SSR): `initialHtml` is baked into the server HTML for SEO and instant
  paint, then re-fetched in the browser to stay current.
- If the browser fetch is blocked (a strict Content-Security-Policy) or offline,
  the baked copy stays put, so the page is never blank.

## Just the data

If you want to render it yourself:

```ts
import { fetchPolicy } from '@scadable/svelte';

const policy = await fetchPolicy('YOUR_PUBLIC_TOKEN');
// { scope_name, domain, version, effective_date, updated_at, html }
```

`policy.html` is an HTML content fragment with scoped styles (class
`scadable-policy`), safe to inject inline. It inherits your page's text color and
already contains the "by scadable.com" backlink.

## Notes

- This package only talks to the public SCADABLE API. It stores no secrets.
- The rendered HTML is your own published content from the SCADABLE API.
