import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ScadablePolicy } from '../dist/index.js';

const dom = new JSDOM('<!doctype html><div id="app"></div>', { url: 'https://customer.test' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function mounted(props, run) {
  const root = createRoot(document.getElementById('app'));
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  console.warn = () => {};
  try { await run(root, props); }
  finally {
    await act(async () => root.unmount());
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  }
}
const props = { tenant: 'acme', document: 'privacy-policy' };

test('blocked fetch offers a published link and retries successfully', async () => {
  await mounted(props, async (root) => {
    globalThis.fetch = async () => { throw new Error('offline'); };
    await act(async () => root.render(React.createElement(ScadablePolicy, props)));
    assert.match(document.body.textContent, /could not load/);
    assert.doesNotMatch(document.body.textContent, /Loading/);
    assert.equal(document.querySelector('a').href, 'https://files.scadable.com/acme/privacy-policy.html');
    globalThis.fetch = async () => new Response('<p>Published legal text</p>', { headers: { 'content-type': 'text/html' } });
    await act(async () => document.querySelector('button').click());
    assert.match(document.body.textContent, /Published legal text/);
    assert.equal(document.querySelector('[role="alert"]'), null);
  });
});

test('changing tenant never preserves the previous tenant document after a failure', async () => {
  await mounted(props, async (root) => {
    globalThis.fetch = async () => new Response('<p>Acme only</p>', { headers: { 'content-type': 'text/html' } });
    await act(async () => root.render(React.createElement(ScadablePolicy, props)));
    assert.match(document.body.textContent, /Acme only/);
    globalThis.fetch = async () => { throw new Error('offline'); };
    await act(async () => root.render(React.createElement(ScadablePolicy, { ...props, tenant: 'globex' })));
    assert.doesNotMatch(document.body.textContent, /Acme only/);
    assert.equal(document.querySelector('a').href, 'https://files.scadable.com/globex/privacy-policy.html');
  });
});

test('a safe initial document remains readable when refresh fails', async () => {
  await mounted(props, async (root) => {
    globalThis.fetch = async () => { throw new Error('offline'); };
    await act(async () => root.render(React.createElement(ScadablePolicy, { ...props, initialHtml: '<p>Server supplied text</p>' })));
    assert.match(document.body.textContent, /Server supplied text/);
    assert.match(document.body.textContent, /could not refresh/);
  });
});
