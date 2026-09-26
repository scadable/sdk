// The token path, pinned to the URL @scadable/core 0.1.2 requests on npm. The
// WordPress, Shopify and Square plugins request the same path, and
// policy.scadable.com serves a token nowhere else.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DEFAULT_BASE_URL, fetchPolicy } from '@scadable/core';

function policyResponse() {
  return new Response(JSON.stringify({ html: '<p>x</p>', version: 1, updated_at: null }), {
    headers: { 'content-type': 'application/json' },
  });
}

test('the default base is policy.scadable.com', () => {
  assert.equal(DEFAULT_BASE_URL, 'https://policy.scadable.com');
});

test('a token is fetched from exactly /policy/{token}?doc_type=...&format=json', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => policyResponse());

  await fetchPolicy('XltJvQpczMk0bDsG', { docType: 'terms_of_use' });

  assert.equal(
    fetch.mock.calls[0].arguments[0],
    'https://policy.scadable.com/policy/XltJvQpczMk0bDsG?doc_type=terms_of_use&format=json',
  );
});

test('the document type defaults to privacy_policy', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => policyResponse());

  await fetchPolicy('XltJvQpczMk0bDsG');

  assert.equal(
    fetch.mock.calls[0].arguments[0],
    'https://policy.scadable.com/policy/XltJvQpczMk0bDsG?doc_type=privacy_policy&format=json',
  );
});

test('the token and the document type are percent-encoded', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => policyResponse());

  await fetchPolicy('a/b c', { docType: 'x&y' });

  assert.equal(
    fetch.mock.calls[0].arguments[0],
    'https://policy.scadable.com/policy/a%2Fb%20c?doc_type=x%26y&format=json',
  );
});

test('a base URL is used as given, less a trailing slash', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => policyResponse());

  await fetchPolicy('tok', { baseUrl: 'https://policy.example.com/v1/' });

  assert.equal(
    fetch.mock.calls[0].arguments[0],
    'https://policy.example.com/v1/policy/tok?doc_type=privacy_policy&format=json',
  );
});

test('revalidate false is an uncached fetch, and the default is ISR for an hour', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => policyResponse());

  await fetchPolicy('tok', { revalidate: false });
  await fetchPolicy('tok');

  assert.deepEqual(fetch.mock.calls[0].arguments[1], { cache: 'no-store' });
  assert.deepEqual(fetch.mock.calls[1].arguments[1], { next: { revalidate: 3600 } });
});

test('a failed response rejects', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('no such policy', { status: 404 }));

  await assert.rejects(fetchPolicy('tok'), /failed to load document \(404\)/);
});

test('no token rejects before any request', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => policyResponse());

  await assert.rejects(fetchPolicy(''), /a policy token is required/);
  assert.equal(fetch.mock.callCount(), 0);
});
