/*
 * Scadable policy embed - Shopify theme app extension client.
 *
 * Finds every Scadable policy container on the page and replaces it with the live
 * document fragment from the SCADABLE API. The fragment is self-styled (scoped class
 * `scadable-policy`) and already contains the "by scadable.com" backlink, so there is
 * nothing else to wire up.
 *
 * Source selection per container (set by blocks/policy.liquid):
 *   - data-scadable-token present  -> fetch the public API directly (CORS is open).
 *   - data-scadable-token empty     -> fetch the first-party app proxy {proxy}/policy,
 *                                       which renders server-side and keeps SEO clean.
 *
 * If the fetch fails (offline, blocked, no published document) the baked <noscript>
 * fallback link is left in place, so the page is never blank.
 */
(function () {
  var API_BASE = 'https://policy.scadable.com';

  function buildUrl(el) {
    var token = (el.getAttribute('data-scadable-token') || '').trim();
    var docType = el.getAttribute('data-scadable-doc-type') || 'privacy_policy';
    var proxy = (el.getAttribute('data-scadable-proxy') || '/apps/scadable').replace(/\/+$/, '');
    var qs = 'doc_type=' + encodeURIComponent(docType) + '&format=fragment';

    if (token) {
      return API_BASE + '/policy/' + encodeURIComponent(token) + '?' + qs;
    }
    return proxy + '/policy?' + qs;
  }

  function hydrate(el) {
    if (el.getAttribute('data-scadable-hydrated') === '1') return;
    el.setAttribute('data-scadable-hydrated', '1');

    fetch(buildUrl(el), { credentials: 'omit' })
      .then(function (r) {
        if (!r.ok) throw new Error('scadable ' + r.status);
        return r.text();
      })
      .then(function (html) {
        // The fragment ships its own <style>; injecting via innerHTML applies it.
        el.innerHTML = html;
      })
      .catch(function () {
        /* keep the baked <noscript> fallback */
        el.removeAttribute('data-scadable-hydrated');
      });
  }

  function run() {
    var nodes = document.querySelectorAll('[data-scadable-policy]');
    for (var i = 0; i < nodes.length; i++) hydrate(nodes[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  // Re-hydrate when a merchant adds or edits the block in the theme editor.
  document.addEventListener('shopify:section:load', run);
})();
