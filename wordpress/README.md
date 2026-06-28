# SCADABLE Privacy & Terms (WordPress plugin)

Display your always-current privacy policy and terms of use on a WordPress site, pulled live from SCADABLE. Enter one token and you are done. The document renders server-side for clean SEO and updates itself whenever you publish a new version in SCADABLE.

This is a pure PHP WordPress plugin. It is not an npm package and is not part of the SDK workspace build.

## How it works

You publish your policy in the SCADABLE app, which gives you a public token. The plugin fetches the currently published document for that token from the public API and prints it into the page on the server:

```
GET https://policy.scadable.com/policy/{token}?doc_type={privacy_policy|terms_of_use}&format=json
```

The JSON response is `{ html, version, updated_at, doc_type, scope_name, domain, effective_date }`. The `html` field is a self-contained fragment: it carries its own `<style>`, inherits the theme's text color, and already includes the "by scadable.com" backlink. The plugin caches each successful response in a transient for up to one hour, so the API is not called on every page view, and exposes a "Refresh now" button to clear that cache on demand.

Because rendering happens in PHP (server-side), the full policy text is present in the page's HTML, which is the cleanest option for search engines.

## Setup (the whole thing)

1. Install and activate the plugin.
2. Settings, then SCADABLE: paste your SCADABLE token. Save.
3. Add the **SCADABLE Policy** block, or the `[scadable_policy]` shortcode, to any page.

Done. The policy renders live and stays current automatically.

## Usage

### Block

Add the **SCADABLE Policy** block in the editor. It has two controls in the sidebar:

- **Token**: leave blank to use the token saved in Settings.
- **Document type**: Privacy policy or Terms of use.

The editor shows a live server-rendered preview.

### Shortcode

```
[scadable_policy]                              // saved token, default doc type
[scadable_policy doc_type="terms_of_use"]      // saved token, terms of use
[scadable_policy token="XltJvQpczMk0bDsG"]     // explicit token
```

Both attributes are optional. `token` falls back to the saved setting; `doc_type` falls back to the saved default (privacy_policy out of the box).

### Widget or sidebar

The block works in block-based widget areas. For classic widgets, put the `[scadable_policy]` shortcode in a Text widget.

## Privacy

The plugin makes exactly one outbound request: it fetches your published policy from `https://policy.scadable.com`, sending only your public token and the document type. No visitor data, personal data, or site data leaves the site. The token is a public identifier for your published documents, not a secret.

## File layout

```
wordpress/
  scadable-policy.php                          Main plugin file: header, constants, bootstrap
  uninstall.php                                Deletes options + cached transients on uninstall
  readme.txt                                   wordpress.org plugin readme
  README.md                                    This file
  includes/
    class-scadable-policy-api.php              API client + transient caching
    class-scadable-policy-settings.php         Settings page (Settings API), one token field
    class-scadable-policy-renderer.php         Shared renderer, shortcode, block render_callback
  blocks/
    policy/
      block.json                               Block metadata (apiVersion 3)
      index.js                                 Minimal editor script (no build step)
```

## Design notes

- **One shared renderer.** The shortcode and the block both call `Scadable_Policy_Renderer::render()`, so output is identical either way.
- **No build step.** `blocks/policy/index.js` is plain ES5 against the global `wp.*` packages and is registered by hand in PHP, so the plugin can be zipped and installed as-is. The block is dynamic: `save()` returns `null` and the server `render_callback` produces the markup (which is what keeps it SEO clean). The editor preview uses `<ServerSideRender />`.
- **Trusted HTML.** The API's `html` fragment is from our own first-party endpoint and intentionally carries inline `<style>`, so it is output as-is rather than through `wp_kses`, which would strip the styling.
- **Caching.** Only successful responses are cached, so a transient outage is retried on the next page view rather than pinned for an hour.
- **Never fatal.** Missing token, network failure, and HTTP errors all return a small message instead of throwing. Admins additionally see the underlying detail to help them fix the token.

## Requirements

- WordPress 5.8+ (block editor / `register_block_type` with `block.json`).
- PHP 7.2+.

## Installing from source

Zip the `wordpress/` directory contents into a folder named `scadable-policy` and upload it under Plugins, then Add New, then Upload Plugin. Or copy the folder into `wp-content/plugins/scadable-policy/` and activate.
