import crypto from 'node:crypto';

/**
 * Verify a Shopify App Proxy request.
 *
 * Every proxied request carries a `signature` query param: the lowercase hex
 * HMAC-SHA256 of all the OTHER query params, sorted by key and concatenated as
 * `key=value` with NO separators, keyed by the app's API secret. Reject anything that
 * does not match so nobody can hit the proxy endpoint directly and spoof a shop.
 *
 * Docs: https://shopify.dev/docs/apps/build/online-store/display-dynamic-data#calculate-a-digital-signature
 *
 * @param {Record<string, string | string[]>} query  parsed query string (req.query)
 * @param {string} secret  the app's API secret (SHOPIFY_API_SECRET)
 * @returns {boolean}
 */
export function verifyAppProxySignature(query, secret) {
  if (!secret) return false;

  const { signature, ...rest } = query;
  if (!signature) return false;

  const message = Object.keys(rest)
    .sort()
    .map((key) => {
      const value = Array.isArray(rest[key]) ? rest[key].join(',') : rest[key];
      return `${key}=${value}`;
    })
    .join('');

  const digest = crypto.createHmac('sha256', secret).update(message).digest('hex');

  // Constant-time compare; guard against length mismatch which timingSafeEqual throws on.
  const a = Buffer.from(digest, 'utf8');
  const b = Buffer.from(String(signature), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
