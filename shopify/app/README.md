# Scadable Shopify app (skeleton)

This is the server half of the integration: a Shopify **App Proxy** that fetches the
merchant's live legal document from the SCADABLE API and returns it under the store
domain so it is server-rendered and SEO clean.

It is a **scaffold**. The proxy handler is complete; OAuth, token storage, and hosting
are stubbed and must be finished before submitting to the Shopify App Store.

## What is implemented

- `GET /proxy/policy` - the App Proxy handler. Verifies Shopify's request signature
  (`lib/verifyProxySignature.js`), fetches the live document
  (`?doc_type=...&format=fragment`) from the SCADABLE API server-side, and returns it as
  `application/liquid` so Shopify renders it inside the store theme. True SSR, first
  party, no client JavaScript.

## What is stubbed (the work to ship)

- **OAuth install** (`/auth`, `/auth/callback`) and **per-shop token storage**. Today
  `tokenForShop()` returns a single env token; production looks it up per shop from your
  DB. Easiest path: build on `@shopify/shopify-app-express` or the Remix app template
  instead of hand-rolling OAuth.
- **Embedded admin UI** (`/app`) - the one screen where the merchant enters their SCADABLE
  token once. Persist it keyed by shop.
- **Mandatory GDPR webhooks** (`customers/data_request`, `customers/redact`,
  `shop/redact`) and `app/uninstalled` cleanup.
- **Hosting** at a stable HTTPS URL, set as `application_url` and the `[app_proxy]` url
  host in `../shopify.app.toml`.

## Run the proxy stub locally

This package is standalone (not in the SDK npm workspaces). Install and run it from THIS
folder only:

```bash
cd shopify/app
npm install
cp .env.example .env   # set SHOPIFY_API_SECRET and SCADABLE_TOKEN
npm run dev
```

To exercise the proxy without Shopify in front of it you must pass a valid `signature`
(HMAC-SHA256 of the sorted query params keyed by `SHOPIFY_API_SECRET`); in normal
operation Shopify adds it. The signature check is in `lib/verifyProxySignature.js`.

Requires Node 18+ (uses the global `fetch`).
