# @scadable/embed

The universal embed. Drop your always-current legal document (privacy policy, terms
of use, and more) into **any** website with **one paste**. Works on WordPress,
Squarespace, Wix, Webflow, Framer, Square Online, Shopify, and hand-coded HTML - no
build step, no framework, no account on the host side.

**One token, zero config.** You publish the document once in the SCADABLE app and paste
the snippet below. The visible copy is pulled live from SCADABLE on every page load, so
editing your policy never means touching the host site again.

## Recommended: the hybrid paste snippet

Paste this where you want the document to appear. Replace `YOUR_TOKEN` with the public
token from the SCADABLE app, and paste your current policy HTML where shown.

```html
<div class="scadable-policy" data-token="YOUR_TOKEN" data-doc-type="privacy_policy">
  <!-- baked snapshot: your current policy HTML goes here -->
</div>
<script src="https://cdn.jsdelivr.net/npm/@scadable/embed/dist/embed.js" async></script>
```

You do not assemble this by hand. The SCADABLE app's **Integrate** screen generates the
whole snippet for you (baked HTML included) with one click - copy, paste, done.

### Why "hybrid", and why it is the default

It is two things in one:

1. **A baked HTML snapshot** - the real policy text plus the `by scadable.com` backlink,
   sitting in the raw HTML of your page. This is crawlable by Google **and** by AI
   engines (GPTBot, ClaudeBot, PerplexityBot, Bingbot) that **do not run JavaScript**.
   A pure client-side widget is invisible to them; the bake is what earns the backlink.
2. **A tiny script** that re-fetches the live document in the browser and swaps the
   visible copy. So the page is always current without a redeploy on your side.

It renders into the **light DOM** (not an iframe, not a shadow root), so your site's
fonts and colors flow straight in and the backlink is credited to **your** page. If the
browser fetch is ever blocked (a strict Content-Security-Policy) or the visitor is
offline, the baked snapshot stays on screen - the page is never blank.

> Why not an iframe? An iframe credits the backlink to api.scadable.com instead of your
> page, which kills the SEO value. Use the hybrid snippet.

## Other ways to embed

### b. Minimal custom element (simplest, live-only)

No baked HTML - the document is rendered entirely in the browser. Simplest to paste, but
because the text is client-rendered it is weaker for AI/search crawlers. Prefer the
hybrid snippet when SEO matters.

```html
<scadable-policy token="YOUR_TOKEN"></scadable-policy>
<script src="https://cdn.jsdelivr.net/npm/@scadable/embed/dist/embed.js" async></script>
```

### c. Iframe escape hatch (only if scripts are forbidden)

For locked-down hosts that do not allow `<script>` at all **and** do not care about the
backlink. This forfeits the SEO backlink (it counts toward api.scadable.com), so it is a
last resort.

```html
<iframe src="https://api.scadable.com/policy/YOUR_TOKEN"
        style="width:100%;border:0;min-height:600px"></iframe>
```

## Configuration

| Attribute | Where | Default | Notes |
| --- | --- | --- | --- |
| `data-token` / `token` | required | - | Your scope's public token from the SCADABLE app. |
| `data-doc-type` / `doc-type` | optional | `privacy_policy` | `privacy_policy`, `terms_of_use`, or any future type. |
| `data-base-url` / `base-url` | optional | `https://api.scadable.com` | Override the API base. Rarely needed. |

Use the `data-*` form on a `<div class="scadable-policy">`; use the bare form on the
`<scadable-policy>` element. Both behave identically.

To embed your **terms of use** as well, paste a second block with `doc-type="terms_of_use"`.

## Per-platform paste instructions

The snippet is plain HTML, so it goes in whatever "custom HTML / embed / code" block your
platform offers:

- **WordPress** - add a **Custom HTML** block (or use the Code Editor) and paste the
  snippet. (Avoid the "Code" block, which escapes HTML.)
- **Squarespace** - add a **Code** block, set it to **HTML** (turn off "Display Source"),
  and paste.
- **Wix** - add **Embed > Embed a Widget** (Custom Embed / HTML iframe), choose **Code**,
  and paste.
- **Webflow** - drag in an **Embed** element and paste the snippet.
- **Framer** - insert an **Embed** component, choose **HTML**, and paste.
- **Square Online** - add a section, choose **Embed Code** (custom HTML), and paste.
- **Shopify** - add a **Custom Liquid** section, or paste into a page via the HTML editor.
- **Raw HTML** - paste anywhere in your page's `<body>`.

In every case it is the **same one snippet**. Paste it once per document.

## Content-Security-Policy note

If your site sends a `Content-Security-Policy` header, allow the script and the API:

```
script-src https://cdn.jsdelivr.net;
connect-src https://api.scadable.com;
```

(If you self-host the script instead of jsdelivr, point `script-src` at your host.) The
**baked snapshot needs nothing** - if a CSP blocks the script, the baked policy text and
the backlink still render. That is the safety net built into the hybrid snippet.

## For app authors (programmatic use)

The package also ships an ESM/CJS entry, so the SCADABLE app can generate the paste
snippet:

```ts
import { snapshotSnippet } from '@scadable/embed';
import { fetchPolicy } from '@scadable/core';

const policy = await fetchPolicy('YOUR_TOKEN', { docType: 'privacy_policy' });
const snippet = snapshotSnippet('YOUR_TOKEN', policy.html, 'privacy_policy');
// -> the full hybrid <div ...>baked</div> + <script ...> string, ready to paste.
```

This entry is import-safe in Node (it touches no DOM), so it works in a server route or
build step. The browser bundle that auto-runs and exposes
`window.ScadablePolicy.{init,mount,register,snapshotSnippet}` is `dist/embed.js`, loaded
via the `<script>` tag above.

## Notes

- This package only talks to the public SCADABLE API. It stores no secrets.
- The rendered HTML is your own published document content, returned by the SCADABLE API
  as a self-styled fragment that already contains the `by scadable.com` backlink.
