import { fetchPolicy } from '@scadable/core';
import type { Policy } from '@scadable/core';

/**
 * @scadable/embed - the universal embed.
 *
 * One paste, any website. This drops your always-current legal document
 * (privacy policy, terms of use, ...) into any no-code or hand-coded page and
 * keeps it live: the visible copy is re-fetched from the SCADABLE API on every
 * load, so editing your policy in the app never means touching the host site.
 *
 * It is built for the HYBRID PASTE SNIPPET (see {@link snapshotSnippet} and the
 * README): a server-baked HTML snapshot of the real policy text plus the
 * "by scadable.com" backlink (crawlable by Google AND by AI engines that do not
 * run JavaScript), with this tiny script layered on top to swap that snapshot
 * for the live version in the browser. We render into LIGHT DOM (never an
 * iframe, never a shadow root) so the host page's fonts and colors flow in and
 * the backlink is credited to the host page, not to policy.scadable.com.
 */

/** CSS class that marks a plain `<div>` as a policy mount point. */
export const SELECTOR = '.scadable-policy';

/** The custom element tag, a nicer alternative to the `<div>` form. */
export const TAG = 'scadable-policy';

/** Default document type when none is given. */
export const DEFAULT_DOC_TYPE = 'privacy_policy';

/** The CDN URL of this script - reused when assembling paste snippets. */
export const CDN_URL = 'https://cdn.jsdelivr.net/npm/@scadable/embed/dist/embed.js';

/** Resolved configuration for a single mount point. */
export interface MountOptions {
  /** The public token from the SCADABLE app. */
  token: string;
  /** Which document to fetch. Default {@link DEFAULT_DOC_TYPE}. */
  docType?: string;
  /** Override the API base. Default `https://policy.scadable.com`. */
  baseUrl?: string;
}

export type { Policy };

/** Read an attribute in either the `<div data-x>` or the `<scadable-policy x>` form. */
function readAttr(el: Element, dataName: string, plainName: string): string | null {
  return el.getAttribute(dataName) ?? el.getAttribute(plainName);
}

/** Pull token / doc-type / base-url off an element, supporting both forms. */
function configFrom(el: Element): MountOptions | null {
  const token = readAttr(el, 'data-token', 'token');
  if (!token) {
    // No token means nothing to fetch. Leave whatever is baked in and warn so
    // the integrator notices the snippet is missing its one required value.
    console.warn('[scadable] skipping a .scadable-policy element with no token');
    return null;
  }
  const docType = readAttr(el, 'data-doc-type', 'doc-type') ?? DEFAULT_DOC_TYPE;
  const baseUrl = readAttr(el, 'data-base-url', 'base-url') ?? undefined;
  return { token, docType, baseUrl };
}

/**
 * Fetch the live document for one element and swap it in.
 *
 * The element keeps whatever is already inside it (the baked snapshot) until the
 * live fetch resolves, then the visible copy is replaced. If the fetch fails - a
 * strict Content-Security-Policy, an offline visitor, an unpublished token - the
 * baked content is left untouched, so the page is never blank. Idempotent: an
 * element is only mounted once.
 */
export async function mount(el: Element, opts?: MountOptions): Promise<Policy | null> {
  const node = el as HTMLElement;
  if (node.dataset.scadableMounted) return null;
  node.dataset.scadableMounted = '1';

  const config = opts ?? configFrom(el);
  if (!config) return null;

  try {
    const policy = await fetchPolicy(config.token, {
      docType: config.docType,
      baseUrl: config.baseUrl,
      // Always fresh in the browser - this is what keeps the visible copy live.
      revalidate: false,
    });
    if (policy?.html) {
      // Light DOM: set innerHTML directly so the host page's CSS applies and the
      // self-styled fragment (it ships its own scoped <style>) renders as-is.
      node.innerHTML = policy.html;
      node.dataset.scadableState = 'live';
    }
    return policy;
  } catch (err) {
    // Keep the baked snapshot. This is the whole point of the hybrid snippet:
    // the crawlable copy stays on the page even when the live fetch cannot run.
    // Mark the node and warn so a failed live fetch (bad token, CSP, offline) is
    // debuggable instead of silently leaving a stale copy.
    node.dataset.scadableState = 'baked';
    node.dataset.scadableError = 'true';
    console.warn(`[@scadable/embed] failed to load policy for token "${config.token}"`, err);
    return null;
  }
}

/**
 * Find every `<div class="scadable-policy">` under `root` and bring each live.
 *
 * `<scadable-policy>` custom elements mount themselves on connect (see
 * {@link register}), so they are not scanned here. Safe to call more than once;
 * already-mounted elements are skipped.
 */
export function init(root: ParentNode = document): void {
  root.querySelectorAll(SELECTOR).forEach((el) => {
    void mount(el);
  });
}

/**
 * Register the `<scadable-policy>` custom element (no-op if already defined or
 * if there is no DOM).
 *
 * The element class is defined lazily, inside this browser-only call, so that
 * `extends HTMLElement` is never evaluated when the module is merely imported in
 * a Node / server context (e.g. the app calling {@link snapshotSnippet}). The
 * element uses LIGHT DOM (no shadow root) on purpose, so the host page styles it
 * like any other element and the backlink counts toward the host page for SEO.
 */
export function register(): void {
  if (typeof customElements === 'undefined' || typeof HTMLElement === 'undefined') return;
  if (customElements.get(TAG)) return;
  class ScadablePolicyElement extends HTMLElement {
    connectedCallback(): void {
      void mount(this);
    }
  }
  customElements.define(TAG, ScadablePolicyElement);
}

/** Escape a value for safe use inside a double-quoted HTML attribute. */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Assemble the recommended HYBRID PASTE SNIPPET from a token and the current
 * policy HTML (as returned by `GET /policy/{token}?...&format=json`).
 *
 * The result is a `<div class="scadable-policy">` with the real policy text
 * baked inside it - crawlable by Google and by AI engines that do not run JS,
 * and including the "by scadable.com" backlink - followed by an `async` script
 * tag that loads this package and swaps the baked copy for the live one. This is
 * what the in-app Integrate UI pastes for the customer.
 *
 * @param token   the scope's public token
 * @param html    the current `policy.html` fragment to bake in
 * @param docType which document this snippet is for. Default {@link DEFAULT_DOC_TYPE}.
 */
export function snapshotSnippet(token: string, html: string, docType: string = DEFAULT_DOC_TYPE): string {
  const t = escapeAttr(token);
  const d = escapeAttr(docType);
  return (
    `<div class="scadable-policy" data-token="${t}" data-doc-type="${d}">\n` +
    `${html}\n` +
    `</div>\n` +
    `<script src="${CDN_URL}" async></script>`
  );
}
