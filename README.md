# SCADABLE SDK

Embed your always-current legal documents (privacy policy, terms of use, and more to
come) into any website, pulled live from SCADABLE on every render. One public token in,
a document that is never stale out.

This is a public monorepo of plugins, one per platform. Every plugin talks only to the
public SCADABLE API. There are no secrets and no server code to run on your side.

## The one idea: zero-friction onboarding

You provide one thing: your public token. That is the whole setup.

The document is pulled live from SCADABLE every time the page renders, so when you edit
your policy in the SCADABLE app, every site that embeds it updates on its own. No
redeploy, no copy-paste, no drift. A static copy that does not pull from us would go
stale the moment you change a line, which is exactly the problem this solves. Live is the
entire point.

```
Your site  --(public token)-->  SCADABLE API  -->  your latest published document
```

## Pick your platform

| Your stack | Use | Install / paste |
| --- | --- | --- |
| Not sure, or you want the fastest path | The setup wizard | `npx @scadable/wizard@latest` |
| Next.js | [`@scadable/next`](./next) | `npm i @scadable/next` |
| React (Vite, CRA, Remix, Gatsby) | [`@scadable/react`](./react) | `npm i @scadable/react` |
| Astro | [`@scadable/astro`](./astro) | `npm i @scadable/astro` |
| Vue or Nuxt | [`@scadable/vue`](./vue) | `npm i @scadable/vue` |
| Svelte or SvelteKit | [`@scadable/svelte`](./svelte) | `npm i @scadable/svelte` |
| Any website, no build step | [`@scadable/embed`](./embed) | paste one snippet (see below) |
| WordPress | [`wordpress/`](./wordpress) plugin | install from the WordPress plugin directory |
| Shopify | [`shopify/`](./shopify) app | install from the Shopify App Store |
| Square Online | [`square/`](./square) snippet | paste the universal embed snippet |
| Squarespace, Wix, Webflow, Framer, raw HTML | [`@scadable/embed`](./embed) | paste one snippet (see below) |

The deeper [platform guide](./docs/platforms.md) walks through every one of these with the
exact step.

## Quickstart

### Option A: the wizard (recommended for any JS framework)

The wizard detects your framework, installs the right package, and writes your document
page for you. It reads only `package.json` and your folder names, never your source.

```bash
npx @scadable/wizard@latest --token YOUR_INSTALL_TOKEN
```

Get `YOUR_INSTALL_TOKEN` from Settings in the SCADABLE app, then paste the whole command.
Commit, deploy, and you are live. That is the full setup.

### Option B: the universal embed (any website, including no-code hosts)

For a site with no build step (Squarespace, Wix, Webflow, Framer, Square Online, or plain
HTML), paste one snippet. The SCADABLE app generates your exact snippet, or the wizard
prints it. It looks like this:

```html
<!-- Paste once. Renders your always-current privacy policy, live from SCADABLE. -->
<div data-scadable-policy
     data-scadable-token="XltJvQpczMk0bDsG"
     data-scadable-doc-type="privacy_policy"></div>
<script async src="https://cdn.jsdelivr.net/npm/@scadable/embed"></script>
```

`XltJvQpczMk0bDsG` is a live demo token you can paste right now to see it work. Swap in
your own token when you are ready. Use `data-scadable-doc-type="terms_of_use"` for your
terms of use.

The snippet bakes a crawlable snapshot of your document into the page and then refreshes
it live in the browser, so search engines and AI engines see the full text and your
visitors always see the current version. See [the hybrid render
rationale](./docs/architecture.md#hybrid-render-bake-for-seo-refresh-for-live).

### Option C: a framework component

Every framework package exposes the same three components. Provide your token and you are
done.

```tsx
// Next.js (app/privacy/page.tsx) or any React app
import { PrivacyPolicy } from '@scadable/next';

export default function Page() {
  return <PrivacyPolicy token="XltJvQpczMk0bDsG" />;
}
```

- `<PrivacyPolicy token="..." />` and `<TermsOfUse token="..." />` are token-only.
- `<ScadablePolicy token="..." docType="..." />` renders any document type, including
  future ones.

## The API every plugin consumes

All packages are thin wrappers over one public endpoint:

```
GET https://policy.scadable.com/policy/{token}?doc_type={privacy_policy|terms_of_use}&format=json
```

Response (`format=json`):

```json
{
  "html": "<section>...your document fragment, ending in the by scadable.com backlink...</section>",
  "version": 7,
  "updated_at": "2026-06-20T18:30:00Z",
  "doc_type": "privacy_policy",
  "scope_name": "Acme Inc",
  "domain": "acme.com",
  "effective_date": "2026-06-20"
}
```

- `doc_type`: `privacy_policy` or `terms_of_use` today. The SDK is document-type-generic,
  so new types work the moment the API serves them.
- `format`: `json` (the default the SDK uses), or `html` / `fragment` to get the raw HTML
  fragment for direct embedding.
- CORS is `*`. The browser can fetch this from any origin, which is what keeps embedded
  documents live with no server on your side.
- `html` is a self-contained fragment (no `<html>` wrapper). It inherits the host page's
  text color and includes the "by scadable.com" backlink.

**Trust boundary:** the `html` is your own first-party document served by SCADABLE over
HTTPS, so every renderer injects it directly (`dangerouslySetInnerHTML` / `innerHTML` /
`{@html}`) with no client-side sanitization, which is safe for trusted first-party HTML.

The shared fetch client and types live in [`@scadable/core`](./core); every other JS
package builds on it.

## Hybrid: baked for SEO, refreshed for live

Frameworks that can render on the server (Next.js, Astro, Nuxt, SvelteKit) and the
universal embed use a hybrid render:

1. Bake the document HTML and the "by scadable.com" backlink into the page at build or
   server-render time, so crawlers (Google and AI engines alike) see the full text and
   the page paints instantly with no layout shift.
2. Re-fetch the live document in the browser, so edits you make in SCADABLE appear with
   no redeploy.

Where there is no server step (a plain React SPA), the package renders client-only and
fetches on mount. If a strict Content-Security-Policy blocks the browser fetch, the baked
copy stays put, so the page is never blank. Full reasoning, including why this beats an
iframe or a bare script tag, is in [docs/architecture.md](./docs/architecture.md).

## Repo layout

```
sdk/
  core/        @scadable/core     shared fetch client + types (every JS package builds on this)
  next/        @scadable/next     Next.js (hybrid SSR bake + live refresh)
  react/       @scadable/react    React: Vite, CRA, Remix, Gatsby (client-only, optional initialHtml)
  astro/       @scadable/astro    Astro (SEO bake + live refresh)
  vue/         @scadable/vue      Vue and Nuxt
  svelte/      @scadable/svelte   Svelte and SvelteKit
  embed/       @scadable/embed    universal one-paste snippet for any site
  wizard/      @scadable/wizard   the npx onboarding CLI
  wordpress/   PHP plugin, ships to the WordPress plugin directory (not npm)
  shopify/     theme app extension + app proxy, ships to the Shopify App Store (not npm)
  square/      universal-embed snippet for Square Online (not npm)
  .github/workflows/publish.yml   OIDC release publishing for the npm packages
  docs/        repo-level guides (platforms, architecture)
```

The eight `@scadable/*` folders are npm workspaces. `wordpress/`, `shopify/`, and
`square/` are distributed through their own platform stores, not npm.

## Develop and build

This is an npm workspaces monorepo. One install at the root wires every package together.

```bash
npm install            # install all workspaces (single root node_modules)
npm run build          # build every package
npm run typecheck      # type-check every package
```

Work on a single package:

```bash
npm run build -w @scadable/next
npm run dev   -w @scadable/core     # tsup --watch
```

## Publish

npm packages publish through a GitHub Release using npm Trusted Publishing (OIDC): no
`NPM_TOKEN`, no 2FA prompt. To cut a release:

1. Bump the `version` in the package's `package.json` (and any dependents).
2. Merge to `main`.
3. Publish a GitHub Release.

`.github/workflows/publish.yml` then builds and publishes every workspace whose version is
not yet on npm, and skips the rest. A brand-new package must be registered once as a
Trusted Publisher on npmjs.com first. Full steps, plus how to add a new platform package,
are in [CONTRIBUTING.md](./CONTRIBUTING.md).

## Docs

- [docs/platforms.md](./docs/platforms.md): which integration for which platform, with the
  exact one-token or one-paste step for each.
- [docs/architecture.md](./docs/architecture.md): how the packages fit together, the
  hybrid render, the document-type-generic design, and the SEO backlink reasoning.
- [CONTRIBUTING.md](./CONTRIBUTING.md): add a new platform package and the release flow.

## License

MIT.
