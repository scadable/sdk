=== SCADABLE Privacy & Terms ===
Contributors: scadable
Tags: privacy policy, terms of use, legal, compliance, gdpr
Requires at least: 5.8
Tested up to: 6.5
Requires PHP: 7.2
Stable tag: 0.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Display your always-current privacy policy and terms of use, pulled live from SCADABLE. One token to set up, rendered server-side for clean SEO.

== Description ==

SCADABLE Privacy & Terms shows your legal documents on your WordPress site, pulled live from your SCADABLE project. You publish and update your policy once in SCADABLE, and every site that embeds it updates itself. There is no static copy to keep in sync and no redeploy on your side.

The plugin renders server-side, so the full policy text is in the page's HTML. That is the cleanest option for search engines and for visitors with JavaScript disabled.

**Zero friction setup.** Install the plugin, enter one thing (your SCADABLE token) in Settings, and you are done. Drop in the block or the shortcode and your policy appears.

= Features =

* Server-side rendering for clean SEO. The policy is in the page HTML, not loaded later by a script.
* A "SCADABLE Policy" block for the block editor, with token and document type controls and a live preview.
* A `[scadable_policy]` shortcode for classic editors, page builders, and widget areas.
* Privacy policy and terms of use supported. Pick a default, or set the type per block or shortcode.
* Responses are cached for up to one hour, so your site stays fast and the API is not called on every page view. A "Refresh now" button fetches the latest version immediately.
* Graceful failure. If the service cannot be reached, visitors see a small neutral message instead of a broken page or a fatal error.

= Privacy =

The plugin makes one outbound request: it fetches your published policy document from `https://api.scadable.com`. It sends only your public token and the document type. No visitor data, personal data, or site data is sent. The token is a public identifier for your published documents, not a secret credential.

== Installation ==

1. Upload the `scadable-policy` folder to `/wp-content/plugins/`, or install the plugin ZIP from Plugins, then Add New, then Upload Plugin.
2. Activate the plugin through the Plugins menu in WordPress.
3. Go to Settings, then SCADABLE, and paste your SCADABLE token. Save.
4. Edit any page. Add the "SCADABLE Policy" block, or paste the shortcode `[scadable_policy]`. Publish.

That is the whole setup. Your policy now renders live and stays current automatically.

== Frequently Asked Questions ==

= Where do I get my token? =

You create and publish your policy in the SCADABLE app, which gives you a public token for it. Paste that token into Settings, then SCADABLE.

= How do I show my terms of use instead of the privacy policy? =

Use `[scadable_policy doc_type="terms_of_use"]`, or pick "Terms of use" in the block's Document type control. You can also set the default in Settings.

= Does the policy update automatically when I change it in SCADABLE? =

Yes. The plugin always fetches your currently published version. Responses are cached for up to one hour. To see a change immediately, open Settings, then SCADABLE, and click "Refresh now".

= Can I use it in a widget or sidebar? =

Yes. Add the "SCADABLE Policy" block to a block-based widget area, or use the `[scadable_policy]` shortcode in a classic Text widget.

= Is the policy good for SEO? =

Yes. The document is rendered on the server, so the full text is in the page's HTML when search engines and visitors load the page.

= What happens if SCADABLE cannot be reached? =

Visitors see a small neutral message. The page never fatals. The next page view retries automatically.

== Screenshots ==

1. The settings page: one field for your SCADABLE token.
2. The "SCADABLE Policy" block with a live preview in the editor.
3. The rendered policy on the front end.

== Changelog ==

= 0.1.0 =
* First release: settings page, `[scadable_policy]` shortcode, "SCADABLE Policy" block, transient caching with a manual refresh, and graceful error handling. Supports privacy policy and terms of use.

== Upgrade Notice ==

= 0.1.0 =
First release.
