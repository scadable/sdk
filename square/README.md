# Scadable on Square - findings

**Bottom line: Square Online is covered by the universal embed (`@scadable/embed`). There
is nothing to build.** Square Online has a custom-code "Embed Code" section, so a merchant
pastes one snippet, sets their token once, and their always-current privacy policy or
terms of use renders live from the SCADABLE API. This folder is documentation plus a
working snippet (`snippet.html`), not a package.

## 1. Square Online supports custom embed code

Square Online is Square's website builder (it descends from Weebly, which Square acquired).
Its editor has an **Embed Code** block (also surfaced as "Embed" / "Code" in the section
list) that accepts arbitrary HTML, including a `<script>`. That is all the universal embed
needs, so no Square-specific package is warranted.

### The snippet

Use the hybrid baked `<div>` plus the shared embed script (`snippet.html`, Option A):

```html
<div
  data-scadable-policy
  data-scadable-token="XltJvQpczMk0bDsG"
  data-scadable-doc-type="privacy_policy">
  <noscript>
    <a href="https://policy.scadable.com/policy/XltJvQpczMk0bDsG?doc_type=privacy_policy&format=html">
      View our Privacy Policy
    </a>
  </noscript>
</div>
<script src="https://cdn.jsdelivr.net/npm/@scadable/embed/dist/embed.js" async></script>
```

Replace `XltJvQpczMk0bDsG` with the merchant's token. Use `doc_type="terms_of_use"` for the
terms page. The baked `<div>` plus `<noscript>` is the no-JS fallback; the script replaces
it with the live, self-styled fragment (which already includes the "by scadable.com"
backlink).

> The `@scadable/embed` script is published to npm and jsdelivr by the SDK release
> workflow. Until that first release lands, the jsdelivr URL 404s. For a build that works
> today with no dependency, `snippet.html` also ships **Option B**, a self-contained
> inline-`<script>` variant that calls the same public API directly (verified against the
> live endpoint, CORS is open). Both produce the same result.

### Where the merchant pastes it (step by step)

1. In the Square Dashboard, open **Online > Website** (or go to the Square Online overview)
   and click **Edit Site** to open the Square Online editor.
2. Create or open the page that should hold the policy (for example a "Privacy Policy"
   page added under Pages / Navigation).
3. Click **Add** (the `+` to add a section/item) and choose the **Embed Code** block.
4. Paste the snippet into the code box and apply/insert.
5. **Publish** the site.

That is the whole flow: one block, one token, done. When the merchant publishes a new
version of the document in the SCADABLE app, the Square Online page reflects it
automatically with no edit on Square's side.

Square Online plan note: custom-code embeds require a paid Square Online plan (the free
plan restricts custom code). This is a Square account-level limit, not a SCADABLE one.

## 2. Square is not Squarespace

These are different, unaffiliated companies, easy to confuse by name:

- **Square** (Block, Inc.) - payments and commerce. Its website builder is **Square
  Online** (Weebly lineage). This document is about Square.
- **Squarespace** - a separate website-builder company. It has its own custom **Code**
  block and is also handled by the universal embed, but it is unrelated to Square.

If a merchant says "Squarespace," that is the other product. Square's builder is "Square
Online."

## 3. Square App Marketplace is POS/commerce, not web widgets

The **Square App Marketplace** lists apps that integrate with Square's **POS, payments,
and commerce** APIs (inventory, orders, payroll, accounting, and so on). It is not a
directory of website widgets for Square Online. There is no "web widget" marketplace to
submit a policy embed to, and none is needed: the answer for Square Online today is the
universal embed snippet above.

### Future opportunity (not today's work)

Square sellers who do not run a Square Online website still have a legal need for a hosted,
current privacy policy (in-person and POS sellers collect customer data too). A later angle
worth tracking:

- A genuine **Square App Marketplace** app that integrates with the seller's Square
  account and offers a hosted/linkable SCADABLE policy URL (for receipts, checkout, or a
  seller profile), reaching sellers who have no website to paste into.
- A Square **dashboard** or point-of-sale surface that links the seller's policy.

These are POS/dashboard integrations (a real app build with OAuth and review), distinct
from the website embed. The website embed is the complete answer for Square Online now;
the POS angle is a future expansion.

## Verification

- Live API confirmed with `curl` (token `XltJvQpczMk0bDsG`): `format=json`, `format=html`,
  and `format=fragment` all return the published privacy policy; the fragment is
  self-styled and carries the "by scadable.com" backlink.
- CORS is open: `access-control-allow-origin: *` on both the GET and the `OPTIONS`
  preflight, so the browser-direct embed works from any Square Online domain.
- `doc_type=terms_of_use` for the demo token returns `{"detail":"no published policy for
  this token"}` (that token only has a privacy policy published); the snippet degrades
  gracefully to the `<noscript>` fallback when a document is not published.
- `@scadable/embed` is not yet on npm/jsdelivr (both 404 at time of writing), which is why
  `snippet.html` includes the self-contained Option B that works today.

## Files

```
square/
  README.md       this findings document
  snippet.html    the paste-in snippet (Option A: universal embed; Option B: self-contained)
```
