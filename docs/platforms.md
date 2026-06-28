# Platforms: which integration to use

Every integration needs exactly one thing from you: your public token. Pick your platform
below and follow the one step. Document text is pulled live from SCADABLE on every render,
so once it is in place you never touch it again, even when you edit your policy.

The examples use the live demo token `XltJvQpczMk0bDsG`. Paste it as-is to see a real
document render, then swap in your own token (and `terms_of_use` in place of
`privacy_policy`) when you are ready.

If you are not sure which path fits, run the wizard and it decides for you:

```bash
npx @scadable/wizard@latest --token YOUR_INSTALL_TOKEN
```

`YOUR_INSTALL_TOKEN` comes from Settings in the SCADABLE app.

## Quick map

| Platform | Integration | Package or plugin |
| --- | --- | --- |
| Next.js | Component | `@scadable/next` |
| React (Vite, CRA, Remix, Gatsby) | Component | `@scadable/react` |
| Astro | Component | `@scadable/astro` |
| Vue, Nuxt | Component | `@scadable/vue` |
| Svelte, SvelteKit | Component | `@scadable/svelte` |
| WordPress | Shortcode / block | `wordpress/` plugin |
| Shopify | Theme app extension | `shopify/` app |
| Squarespace | Code block snippet | `@scadable/embed` |
| Wix | HTML embed snippet | `@scadable/embed` |
| Webflow | HTML embed snippet | `@scadable/embed` |
| Framer | Embed component snippet | `@scadable/embed` |
| Square Online | Embed code snippet | `square/` (universal embed) |
| Raw HTML or anything else | One-paste snippet | `@scadable/embed` |

Every component package exposes the same API:

- `<PrivacyPolicy token="..." />` and `<TermsOfUse token="..." />`: token-only, document
  type fixed.
- `<ScadablePolicy token="..." docType="..." />`: any document type, including future ones.
- Optional props: `className` (or `class`), `showVersion`, `baseUrl`.

## JavaScript frameworks

### Next.js: `@scadable/next`

Hybrid by design: the document is baked into the static HTML at build or server-render
time (crawlable, instant paint) and refreshed live in the browser.

```bash
npm i @scadable/next
```

```tsx
// app/privacy/page.tsx
import { PrivacyPolicy } from '@scadable/next';

export default function Page() {
  return <PrivacyPolicy token="XltJvQpczMk0bDsG" />;
}
```

Terms of use, or any document type:

```tsx
import { TermsOfUse, ScadablePolicy } from '@scadable/next';

<TermsOfUse token="XltJvQpczMk0bDsG" />
<ScadablePolicy token="XltJvQpczMk0bDsG" docType="terms_of_use" showVersion />
```

Works in both the App Router and the Pages Router.

### React (Vite, CRA, Remix, Gatsby): `@scadable/react`

Client-rendered: the document is fetched in the browser on mount. If your host already
did its own server or build-time fetch, pass `initialHtml` so the text is crawlable and
paints with no flash.

```bash
npm i @scadable/react
```

```tsx
import { PrivacyPolicy } from '@scadable/react';

export default function PrivacyPage() {
  return <PrivacyPolicy token="XltJvQpczMk0bDsG" />;
}
```

This is the right package for Remix and Gatsby routes too: import the component into your
route and provide the token.

### Astro: `@scadable/astro`

Hybrid: baked at build or SSR time for SEO, then refreshed live by a tiny hoisted script.

```bash
npm i @scadable/astro
```

```astro
---
import { ScadablePolicy } from '@scadable/astro';
---
<ScadablePolicy token="XltJvQpczMk0bDsG" docType="privacy_policy" />
```

### Vue and Nuxt: `@scadable/vue`

```bash
npm i @scadable/vue
```

```vue
<script setup>
import { PrivacyPolicy } from '@scadable/vue';
</script>

<template>
  <PrivacyPolicy token="XltJvQpczMk0bDsG" />
</template>
```

In Nuxt, render it inside a page and let Nuxt SSR bake the first paint; the component
refreshes live in the browser. Pass `initialHtml` if you fetch on the server yourself.

### Svelte and SvelteKit: `@scadable/svelte`

```bash
npm i @scadable/svelte
```

```svelte
<script>
  import { PrivacyPolicy } from '@scadable/svelte';
</script>

<PrivacyPolicy token="XltJvQpczMk0bDsG" />
```

In SvelteKit, the document is baked during SSR and refreshed live in the browser.

## No-code and hosted platforms

These platforms have no build step, so the integration is the universal embed: one snippet
that bakes a crawlable snapshot and refreshes it live. The SCADABLE app generates your
exact snippet, or the wizard prints it. The shape is always the same:

```html
<div data-scadable-policy
     data-scadable-token="XltJvQpczMk0bDsG"
     data-scadable-doc-type="privacy_policy"></div>
<script async src="https://cdn.jsdelivr.net/npm/@scadable/embed"></script>
```

For terms of use, set `data-scadable-doc-type="terms_of_use"`. You can place more than one
document block on a page; a single script handles them all.

### WordPress: the `wordpress/` plugin

Do not paste raw HTML on WordPress. Install the SCADABLE plugin from the WordPress plugin
directory, open its settings, paste your token once, then drop the SCADABLE block (or the
shortcode) on your privacy page. The plugin renders the live document and keeps it current.

### Shopify: the `shopify/` app

Install the SCADABLE app from the Shopify App Store and connect your token. It adds a theme
app extension, so you place a "Privacy policy" block in the theme editor with no code. An
app proxy serves the live document on your storefront.

### Squarespace

Add a Code block to your privacy page and paste the universal embed snippet above.
Squarespace renders custom HTML in Code blocks, so the snapshot shows immediately and the
script refreshes it live.

### Wix

Add an Embed element (Embed a Widget, the HTML embed) to the page and paste the universal
embed snippet. Publish, and the live document appears.

### Webflow

Add an Embed element (HTML embed) where you want the document and paste the universal embed
snippet. Publish the site.

### Framer

Add an Embed component (or a Code component) to the page and paste the universal embed
snippet. Framer renders the snapshot and runs the refresh script on the published site.

### Square Online: `square/`

Square Online sites use the universal embed too. Add an Embed code section to your page and
paste the snippet from `square/` (the same universal embed, packaged with Square Online
notes). Your token is the only value you change.

### Raw HTML or any other host: `@scadable/embed`

Anywhere you can paste HTML, paste the universal embed snippet. Nothing else to install.

## After setup

You are done. When you publish a new version of your document in the SCADABLE app, every
integration above shows it on the next render, with no redeploy and no edit on your side.

If your site sends a strict Content-Security-Policy, allow `policy.scadable.com` in
`connect-src` so the browser refresh can run. Without it the integration still shows the
last baked copy, so the page is never blank, it just will not update live until the policy
allows the fetch.
