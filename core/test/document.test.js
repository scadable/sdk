// The tenant and document path: a document policy published to
// files.scadable.com/{tenant}/{document}.html.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

import * as core from '@scadable/core';
import {
  DEFAULT_DOCUMENT_BASE_URL,
  documentSlug,
  documentUrl,
  fetchDocument,
  isAllowedHtml,
} from '@scadable/core';

const PRIVACY = '<h1>Privacy Policy</h1>\n<p>We process personal data on the lawful bases set out below.</p>\n';

// Bytes rather than a string, because a string body is given a text/plain
// content type by default and the tests need the headers to be exactly these.
function htmlResponse(body, headers = { 'content-type': 'text/html; charset=utf-8' }, status = 200) {
  return new Response(new TextEncoder().encode(body), { status, headers });
}

test('the default base is files.scadable.com', () => {
  assert.equal(DEFAULT_DOCUMENT_BASE_URL, 'https://files.scadable.com');
});

test('a document is fetched from {base}/{tenant}/{document}.html and returned with its URL', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => htmlResponse(PRIVACY));

  const doc = await fetchDocument({ tenant: 'org_2mXq9ZtK-4', document: 'privacy-policy' });

  const url = 'https://files.scadable.com/org_2mXq9ZtK-4/privacy-policy.html';
  assert.equal(fetch.mock.calls[0].arguments[0], url);
  assert.deepEqual(doc, { html: PRIVACY, url });
});

test('a base URL is used as given, less trailing slashes', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => htmlResponse(PRIVACY));

  await fetchDocument({ tenant: 'acme', document: 'terms-of-use' }, { baseUrl: 'http://localhost:8787/files//' });

  assert.equal(fetch.mock.calls[0].arguments[0], 'http://localhost:8787/files/acme/terms-of-use.html');
});

test('documentUrl is the URL fetchDocument requests', () => {
  assert.equal(
    documentUrl({ tenant: 'acme', document: 'cookie-policy' }),
    'https://files.scadable.com/acme/cookie-policy.html',
  );
});

test('revalidate false is an uncached fetch, and the default is ISR for an hour', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => htmlResponse(PRIVACY));

  await fetchDocument({ tenant: 'acme', document: 'imprint' }, { revalidate: false });
  await fetchDocument({ tenant: 'acme', document: 'imprint' });

  assert.deepEqual(fetch.mock.calls[0].arguments[1], { cache: 'no-store' });
  assert.deepEqual(fetch.mock.calls[1].arguments[1], { next: { revalidate: 3600 } });
});

test('a document type maps to the slug it is published under', () => {
  assert.equal(documentSlug('privacy_policy'), 'privacy-policy');
  assert.equal(documentSlug('terms_of_use'), 'terms-of-use');
  assert.equal(documentSlug('cookie_policy'), 'cookie-policy');
  assert.equal(documentSlug('imprint'), 'imprint');
});

const BAD_TENANTS = [
  '',
  'a/b',
  '..',
  '../acme',
  'acme corp',
  'acme.example',
  'acme%2Fx',
  'acme?x=1',
  'acme#x',
  'acme\n',
  'x'.repeat(129),
  undefined,
  null,
  42,
];

const BAD_DOCUMENTS = [
  '',
  'privacy_policy',
  'Privacy-Policy',
  '-privacy',
  'privacy-policy.html',
  'uploads/report',
  '../privacy-policy',
  'privacy policy',
  'privacy-policy\n',
  undefined,
  null,
];

test('a tenant that is not an id is rejected before any request', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => htmlResponse(PRIVACY));

  for (const tenant of BAD_TENANTS) {
    await assert.rejects(fetchDocument({ tenant, document: 'privacy-policy' }), /is not a tenant id/, String(tenant));
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('a document that is not a slug is rejected before any request', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => htmlResponse(PRIVACY));

  for (const document of BAD_DOCUMENTS) {
    await assert.rejects(fetchDocument({ tenant: 'acme', document }), /is not a document slug/, String(document));
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('a tenant of 128 characters is still an id', () => {
  const tenant = 'x'.repeat(128);
  assert.equal(documentUrl({ tenant, document: 'imprint' }), `https://files.scadable.com/${tenant}/imprint.html`);
});

test('a base URL that is not http or https is rejected before any request', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => htmlResponse(PRIVACY));

  for (const baseUrl of ['javascript:alert(1)', 'ftp://files.example.com', 'files.scadable.com', '/files']) {
    await assert.rejects(
      fetchDocument({ tenant: 'acme', document: 'imprint' }, { baseUrl }),
      /is not an http or https base URL/,
      baseUrl,
    );
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('a response that is not text/html is rejected', async (t) => {
  let headers = {};
  t.mock.method(globalThis, 'fetch', async () => htmlResponse(PRIVACY, headers));

  for (headers of [{ 'content-type': 'text/plain' }, { 'content-type': 'application/json' }, {}]) {
    await assert.rejects(fetchDocument({ tenant: 'acme', document: 'imprint' }), /not text\/html/, JSON.stringify(headers));
  }
});

test('text/html is recognised with a charset and in any case', async (t) => {
  let type = '';
  t.mock.method(globalThis, 'fetch', async () => htmlResponse(PRIVACY, { 'content-type': type }));

  for (type of ['text/html', 'text/html; charset=utf-8', 'TEXT/HTML;charset=UTF-8']) {
    const doc = await fetchDocument({ tenant: 'acme', document: 'imprint' });
    assert.equal(doc.html, PRIVACY, type);
  }
});

test('a failed response rejects', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => htmlResponse('<Error/>', { 'content-type': 'application/xml' }, 404));

  await assert.rejects(
    fetchDocument({ tenant: 'acme', document: 'imprint' }),
    /failed to load https:\/\/files\.scadable\.com\/acme\/imprint\.html \(404\)/,
  );
});

test('a document the allowlist refuses is not returned: a plain link to it is, with a warning', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  t.mock.method(globalThis, 'fetch', async () =>
    htmlResponse('<h1>Privacy Policy</h1><script>document.cookie</script>'),
  );

  const doc = await fetchDocument({ tenant: 'acme', document: 'privacy-policy' });

  const url = 'https://files.scadable.com/acme/privacy-policy.html';
  assert.deepEqual(doc, {
    html: `<p><a href="${url}" rel="noopener noreferrer">Privacy policy</a></p>`,
    url,
  });
  assert.equal(isAllowedHtml(doc.html), true);
  assert.equal(warn.mock.callCount(), 1);
  assert.match(warn.mock.calls[0].arguments[0], /was not inserted/);
});

test('the link shown in place of a refused document escapes its URL', async (t) => {
  t.mock.method(console, 'warn', () => {});
  t.mock.method(globalThis, 'fetch', async () => htmlResponse('<p onclick="x()">y</p>'));

  const doc = await fetchDocument(
    { tenant: 'acme', document: 'terms-of-use' },
    { baseUrl: 'https://files.example.com/a&b"c' },
  );

  assert.equal(
    doc.html,
    '<p><a href="https://files.example.com/a&amp;b&quot;c/acme/terms-of-use.html" rel="noopener noreferrer">Terms of use</a></p>',
  );
  assert.equal(isAllowedHtml(doc.html), true);
});

test('the ESM and CommonJS builds export the same names', () => {
  const required = createRequire(import.meta.url)('@scadable/core');
  assert.deepEqual(Object.keys(required).sort(), Object.keys(core).sort());
  assert.deepEqual(Object.keys(core).sort(), [
    'DEFAULT_BASE_URL',
    'DEFAULT_DOCUMENT_BASE_URL',
    'documentSlug',
    'documentUrl',
    'fetchDocument',
    'fetchPolicy',
    'isAllowedHtml',
  ]);
});
