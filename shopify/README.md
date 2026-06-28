# Scadable for Shopify

Show your store's always-current privacy policy and terms of use, pulled **live** from the
SCADABLE API. You publish the document once in the SCADABLE app; the store always renders
the version you last published, with no theme edit and no redeploy when you update it.

This folder is a **scaffold** for a Shopify app. The theme app extension (the block a
merchant drops onto a page) is complete; the app server it talks to is stubbed at the
points that need OAuth, hosting, and App Store review. See "What is implemented vs
scaffolded" below.

> This is a standalone folder. It is **not** part of the `@scadable/sdk` npm workspaces and
> nothing here is published to npm. The theme extension ships through the Shopify CLI; the
> app server is hosted by you.

## Architecture

Two standard, current Shopify building blocks (no deprecated ScriptTag API):

1. **Theme app extension** (`extensions/scadable-policy/`) - an **app block** named
   "Privacy / Terms". After the merchant installs the app, they add it to any page from
   the theme editor (Add block > Apps > Scadable Policy). The block renders the live
   document and exposes one setting: the document type, plus an optional token field.

2. **App Proxy** (`app/`) - a route exposed under the **store's own domain** at
   `/apps/scadable/*`. Shopify forwards those requests to your app server, which fetches
   the document from the SCADABLE API server-side and returns it as `application/liquid`.
   Shopify renders that inside the store theme, so the policy is server-rendered, first
   party, and crawlable.

### Two rendering modes

| Mode | How | SEO | Needs the app server? |
| --- | --- | --- | --- |
| **(a) App Proxy / SSR** (recommended) | The block is left tokenless and requests `/apps/scadable/policy?doc_type=...`; the server renders it. You can also link that URL directly as a standalone policy page. | Server-rendered, crawlable | Yes |
| **(b) Client-side** | The merchant enters their public token in the block; the browser fetches the SCADABLE API directly (CORS is open) and injects the fragment. | Client-injected (weaker) | No |

The block supports both from the same code: if the token field is blank it uses the proxy
(mode a); if a token is entered it fetches directly (mode b). Mode (b) works the moment
the app block is installed, even before you host the app server - a good first step.

The container is **hybrid**: it bakes a `<noscript>` link to the document, then the
client script (`assets/scadable-policy.js`) replaces it with the live fragment. If the
fetch is ever blocked or offline, the link stays, so the page is never blank. The fetched
fragment is self-styled and already carries the "by scadable.com" backlink.

## Zero-friction merchant flow

1. Install the Scadable app from the Shopify App Store.
2. Enter your SCADABLE token once on the app's setup screen (stored per shop). With mode
   (a) you never type it again.
3. Open the theme editor, go to your Privacy Policy page, choose **Add block > Apps >
   Scadable Policy**, pick the document (Privacy Policy or Terms of Use). Done.

From then on, publishing a new version in the SCADABLE app updates the storefront with no
further action.

## The API this talks to

```
GET https://policy.scadable.com/policy/{token}?doc_type={privacy_policy|terms_of_use}&format={json|html|fragment}
```

`format=fragment` returns a self-styled HTML fragment (scoped `scadable-policy` class) with
the backlink, which is what both the block and the proxy inject. CORS is open (`*`), so the
browser-direct path (mode b) needs no backend. The app server only ever talks to this
public API and stores no secrets of ours.

## File tree

```
shopify/
  README.md                                  this file
  shopify.app.toml                           app config (app proxy + scopes) - SCAFFOLD
  .gitignore
  extensions/
    scadable-policy/
      shopify.extension.toml                 theme app extension config
      blocks/
        policy.liquid                        the "Privacy / Terms" app block (+ schema)
      assets/
        scadable-policy.js                   client fetch + inject (hybrid fallback)
      locales/
        en.default.json                      block string(s)
  app/                                        App Proxy server - SCAFFOLD (standalone)
    server.js                                 GET /proxy/policy (implemented) + OAuth stubs
    lib/
      verifyProxySignature.js                Shopify proxy HMAC verification
    package.json                             standalone, NOT an SDK workspace
    .env.example
    README.md
```

## What is implemented vs scaffolded

**Implemented and usable now**
- The theme app extension and the "Privacy / Terms" app block, both rendering modes.
- The client fetch/inject with the hybrid no-JS fallback.
- The App Proxy handler `GET /proxy/policy`, including Shopify signature verification and
  the server-side fetch that returns `application/liquid`.

**Scaffolded - the remaining work to ship to the App Store**
- **OAuth** install flow (`/auth`, `/auth/callback`) and **per-shop token storage**. The
  stub's `tokenForShop()` returns one env token; production resolves it per shop from your
  DB. Build on `@shopify/shopify-app-express` or the Remix template rather than hand-rolling.
- **Embedded admin UI** - the one screen where the merchant enters their token once.
- **Access scopes**: none are required for this app (the extension and proxy read no store
  data); `shopify.app.toml` keeps `scopes = ""`.
- **Billing**: if you charge, add the Billing API and declare pricing.
- **Mandatory GDPR webhooks** (`customers/data_request`, `customers/redact`, `shop/redact`)
  and `app/uninstalled` teardown.
- **Hosting** the app server at a stable HTTPS URL and setting it as `application_url` and
  the `[app_proxy]` host.
- **App Store listing + review**: listing copy, screenshots, privacy details, and passing
  Shopify's automated + manual review.

## Develop the extension

With the Shopify CLI installed and the app created in the Partner Dashboard:

```bash
cd shopify
shopify app config link     # bind this folder to your app, fills client_id
shopify app dev             # live-preview the extension on a dev store
shopify app deploy          # push the theme app extension version
```

The app server is run and hosted separately - see `app/README.md`.
