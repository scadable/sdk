/*
 * Scadable Shopify app - App Proxy server.
 *
 * SCAFFOLD. The App Proxy handler (GET /proxy/policy) below is complete and correct; the
 * OAuth install flow and per-shop token storage are stubbed and must be finished before
 * this can be hosted and submitted to the Shopify App Store. See ./README.md.
 *
 * How the proxy makes the policy server-rendered under the STORE domain:
 *   Storefront URL  https://<shop>.myshopify.com/apps/scadable/policy?doc_type=...
 *     -> Shopify proxies to  https://<your-host>/proxy/policy?...  (+ shop, signature, ...)
 *     -> this handler verifies the signature, fetches the merchant's live document from
 *        the SCADABLE API, and returns it as `application/liquid`
 *     -> Shopify renders that Liquid INSIDE the store's theme layout.
 *   Result: true SSR, crawlable, first-party, no client JavaScript required.
 *
 * The path mapping (subpath `scadable`, prefix `apps`, url `.../proxy`) is declared in
 * ../shopify.app.toml under [app_proxy].
 */
import express from 'express';
import { verifyAppProxySignature } from './lib/verifyProxySignature.js';

const app = express();

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';
const SCADABLE_API = (process.env.SCADABLE_API || 'https://policy.scadable.com').replace(/\/+$/, '');
const ALLOWED_DOC_TYPES = ['privacy_policy', 'terms_of_use'];

/**
 * Resolve the SCADABLE token for a shop.
 *
 * PRODUCTION: look this up from your app database, where you stored it when the merchant
 * installed the app / entered it in app settings (one token per shop). That single
 * "enter it once" step is the whole merchant configuration.
 *
 * STUB: fall back to a single env token so the proxy is runnable today.
 */
function tokenForShop(shop) {
  // TODO: return (await db.shop(shop))?.scadableToken;
  return process.env.SCADABLE_TOKEN || '';
}

// --- App Proxy: live, server-rendered policy under the store domain -------------------
app.get('/proxy/policy', async (req, res) => {
  // 1) Prove the request actually came from Shopify's proxy.
  if (!verifyAppProxySignature(req.query, SHOPIFY_API_SECRET)) {
    return res.status(401).type('text/plain').send('invalid signature');
  }

  // 2) Resolve and validate inputs.
  const shop = String(req.query.shop || '');
  let docType = String(req.query.doc_type || 'privacy_policy');
  if (!ALLOWED_DOC_TYPES.includes(docType)) docType = 'privacy_policy';

  const token = tokenForShop(shop);
  if (!token) {
    return res
      .status(200)
      .type('application/liquid')
      .send('<p>This policy is not configured yet. Add your SCADABLE token in the app.</p>');
  }

  // 3) Fetch the live document server-side, return it as Liquid for Shopify to wrap in
  //    the theme. `format=fragment` is self-styled and carries the scadable.com backlink.
  try {
    const url =
      `${SCADABLE_API}/policy/${encodeURIComponent(token)}` +
      `?doc_type=${encodeURIComponent(docType)}&format=fragment`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`scadable ${r.status}`);
    const fragment = await r.text();

    res.set('Cache-Control', 'public, max-age=300');
    return res.status(200).type('application/liquid').send(fragment);
  } catch (err) {
    return res
      .status(502)
      .type('application/liquid')
      .send('<p>We could not load this policy right now. Please try again shortly.</p>');
  }
});

// --- OAuth install + lifecycle: SCAFFOLD ONLY (required for the App Store) -------------
// These are the routes you still need. A real implementation typically uses
// `@shopify/shopify-app-express` (or the Remix template) rather than hand-rolling them.
//
//   app.get('/auth', ...)                      // begin OAuth, redirect to the shop's consent screen
//   app.get('/auth/callback', ...)             // exchange the code for an offline token, store per shop
//   app.post('/webhooks/app/uninstalled', ...) // delete the shop + its token (GDPR/teardown)
//   app.post('/webhooks/customers/data_request', ...)  // mandatory GDPR webhooks
//   app.post('/webhooks/customers/redact', ...)
//   app.post('/webhooks/shop/redact', ...)
//   app.get('/app', ...)                       // embedded admin UI: one field to enter/confirm the token
//
// The embedded admin UI is where the merchant enters their SCADABLE token once. Persist
// it keyed by shop, and tokenForShop() above returns it.

const port = process.env.PORT || 3000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`scadable shopify app proxy (stub) listening on :${port}`);
});

export default app;
