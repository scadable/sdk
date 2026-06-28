# @scadable/vue

Render your always-current privacy policy or terms of use in a Vue 3 or Nuxt app.
You publish the document once in the SCADABLE app; this component shows whatever
version is currently published, so updating it never means a redeploy on your side.

## Install

```bash
npm install @scadable/vue
```

## Use (Vue 3)

Give it your public token and you are done. The document is pulled live when the
component mounts.

```vue
<script setup lang="ts">
import { PrivacyPolicy } from '@scadable/vue';
</script>

<template>
  <PrivacyPolicy token="YOUR_PUBLIC_TOKEN" />
</template>
```

Terms of use is the same, with `TermsOfUse`:

```vue
<script setup lang="ts">
import { TermsOfUse } from '@scadable/vue';
</script>

<template>
  <TermsOfUse token="YOUR_PUBLIC_TOKEN" />
</template>
```

Get `YOUR_PUBLIC_TOKEN` from the SCADABLE app after you publish a document.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `token` | `string` | required | Your scope's public token. |
| `class` | `string` | none | Class on the wrapper element. |
| `initialHtml` | `string` | none | HTML to render before the live fetch resolves (used for SSR, see below). |
| `baseUrl` | `string` | `https://policy.scadable.com` | Override the API base. |

`ScadablePolicy` is the same component with one extra prop, `docType`
(`"privacy_policy"` by default, or `"terms_of_use"`). `PrivacyPolicy` and
`TermsOfUse` are just `ScadablePolicy` with `docType` locked in.

## Nuxt (SSR)

For SEO you want the legal text and the "by scadable.com" backlink in the
server-rendered HTML. Fetch the document in `useAsyncData` and pass it as
`initialHtml`; the component renders it on the server, then refreshes live in the
browser so published edits appear with no redeploy.

```vue
<script setup lang="ts">
import { PrivacyPolicy, fetchPolicy } from '@scadable/vue';

const token = 'YOUR_PUBLIC_TOKEN';
const { data } = await useAsyncData('privacy-policy', () =>
  fetchPolicy(token, { docType: 'privacy_policy' }),
);
</script>

<template>
  <PrivacyPolicy :token="token" :initial-html="data?.html" />
</template>
```

## Live behavior

- Plain Vue (Vite SPA): the document is fetched in the browser on mount.
- Nuxt (SSR): `initialHtml` is baked into the server HTML for SEO and instant
  paint, then re-fetched in the browser to stay current.
- If the browser fetch is blocked (a strict Content-Security-Policy) or offline,
  the baked copy stays put, so the page is never blank.

## Just the data

If you want to render it yourself:

```ts
import { fetchPolicy } from '@scadable/vue';

const policy = await fetchPolicy('YOUR_PUBLIC_TOKEN');
// { scope_name, domain, version, effective_date, updated_at, html }
```

`policy.html` is an HTML content fragment with scoped styles (class
`scadable-policy`), safe to inject inline. It inherits your page's text color and
already contains the "by scadable.com" backlink.

## Notes

- This package only talks to the public SCADABLE API. It stores no secrets.
- The rendered HTML is your own published content from the SCADABLE API.
