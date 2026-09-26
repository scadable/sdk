// The check every document from files.scadable.com passes before it is inserted:
// the tags, attributes and URL schemes of policy's HTML allowlist, and nothing a
// browser would read differently from this check.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { isAllowedHtml } from '@scadable/core';

const TAGS = ['a', 'blockquote', 'br', 'em', 'h1', 'h2', 'h3', 'li', 'ol', 'p', 'strong', 'u', 'ul'];

// Shaped like what engine renders for Business Basics: headings, indented
// paragraphs, line breaks and escaped text.
const BUSINESS_BASICS_SHAPE = `<h1>Imprint</h1>
<p>
  Example Trading Ltd<br>
  1 Example Street, Springfield
</p>

<h2>Contact</h2>

<p>
  Write to privacy@example.com about anything in this document, including what
  we hold about you &amp; how to ask us to delete it.
</p>
`;

const ACCEPTED = [
  ['the empty document', ''],
  ['plain text', 'Just words.'],
  ['a document shaped like engine output', BUSINESS_BASICS_SHAPE],
  [
    'every allowed tag',
    '<h1>One</h1><h2>Two</h2><h3>Three</h3><p>A <strong>bold</strong>, <em>emphasised</em> and ' +
      '<u>underlined</u> line<br>broken in two.</p><ul><li>first</li></ul><ol><li>second</li></ol>' +
      '<blockquote><p>Quoted.</p></blockquote>',
  ],
  ['an https link with the rel policy writes', '<a href="https://example.com/terms" rel="noopener noreferrer">x</a>'],
  ['an http link', '<a href="http://example.com/" rel="noopener noreferrer">x</a>'],
  ['a mailto link', '<a href="mailto:privacy@example.com" rel="noopener noreferrer">x</a>'],
  ['a link with no rel', '<a href="https://example.com">x</a>'],
  ['a link whose href policy removed', '<a rel="noopener noreferrer">x</a>'],
  ['an escaped ampersand in a query string', '<a href="https://example.com/?a=1&amp;b=2" rel="noopener noreferrer">x</a>'],
  ['escaped text', '<p>Fish &amp; chips &lt; 5 &gt; 3, "quoted" and \'single\'.</p>'],
  ['a no-break space entity', '<p>10&nbsp;km</p>'],
  ['non-ASCII text', '<p>Café Zürich, 日本語</p>'],
  ['a self-closing br', '<p>a<br/>b</p>'],
  ['uppercase tags', '<P>x</P>'],
  ['whitespace inside tags', '<p >x</p\n><a\nhref="https://example.com"\trel="noopener noreferrer" >y</a>'],
];

const REFUSED = [
  ['a script', '<script>alert(1)</script><p>x</p>'],
  ['a script split around another', '<scr<script>ipt>alert(1)</script>'],
  ['an onclick handler', '<p onclick="alert(1)">x</p>'],
  ['an onclick handler on a link', '<a href="https://example.com" onclick="alert(1)">x</a>'],
  ['an event handler with no space before it', '<a href="https://example.com"onclick="alert(1)">x</a>'],
  ['a style element', '<style>p{color:red}</style><p>x</p>'],
  ['a style attribute', '<p style="color:red">x</p>'],
  ['a javascript: link', '<a href="javascript:alert(1)">x</a>'],
  ['a javascript: link in capitals', '<a href="JAVASCRIPT:alert(1)">x</a>'],
  ['a javascript: link after a space', '<a href=" javascript:alert(1)">x</a>'],
  ['a javascript: link split by a tab', '<a href="java\tscript:alert(1)">x</a>'],
  ['a javascript: link spelled with &colon;', '<a href="javascript&colon;alert(1)">x</a>'],
  ['a javascript: link spelled with a numeric reference', '<a href="&#106;avascript:alert(1)">x</a>'],
  ['a second href after a safe one', '<a href="https://example.com" href="javascript:alert(1)">x</a>'],
  ['a vbscript: link', '<a href="vbscript:msgbox(1)">x</a>'],
  ['a data: link', '<a href="data:text/html,x">x</a>'],
  ['an ftp link', '<a href="ftp://example.com/file">x</a>'],
  ['a relative link', '<a href="/terms">x</a>'],
  ['a fragment link', '<a href="#section">x</a>'],
  ['an empty link', '<a href="">x</a>'],
  ['a bare ampersand in an attribute', '<a href="https://example.com/?a=1&b=2">x</a>'],
  ['target', '<a href="https://example.com" target="_blank">x</a>'],
  ['class and id', '<p class="lead" id="intro">x</p>'],
  ['title and lang', '<p title="t" lang="en">x</p>'],
  ['a single-quoted attribute', "<a href='https://example.com'>x</a>"],
  ['an unquoted attribute', '<a href=https://example.com>x</a>'],
  ['an image', '<p>x<img src="https://example.com/a.png" onerror="alert(1)"></p>'],
  ['an iframe', '<iframe src="https://example.com"></iframe>'],
  ['an svg', '<svg onload="alert(1)"><circle r="1"></circle></svg>'],
  ['a form', '<form action="https://example.com"><input name="password"></form>'],
  ['a base element', '<base href="https://example.com/">'],
  ['a div', '<div>x</div>'],
  ['a span', '<span>x</span>'],
  ['a fourth-level heading', '<h4>Deep</h4>'],
  ['a table', '<table><tr><td>x</td></tr></table>'],
  ['a comment', '<!-- note --><p>x</p>'],
  ['a doctype', '<!DOCTYPE html><p>x</p>'],
  ['a bare less-than', '<p>5 < 6</p>'],
  ['an unclosed element', '<p>x'],
  ['a stray end tag', '</p>'],
  ['an end tag on br', '</br>'],
  ['elements closed out of order', '<strong><em>x</strong></em>'],
  ['a solidus on a paragraph', '<p/>x'],
  ['an end tag with an attribute', '<p>x</p class="y">'],
  ['a NUL character', '<p>a\u0000b</p>'],
];

for (const [name, html] of ACCEPTED) {
  test(`accepts ${name}`, () => {
    assert.equal(isAllowedHtml(html), true);
  });
}

for (const [name, html] of REFUSED) {
  test(`refuses ${name}`, () => {
    assert.equal(isAllowedHtml(html), false);
  });
}

test('accepts exactly the 13 tags policy allows', () => {
  for (const tag of TAGS) {
    assert.equal(isAllowedHtml(tag === 'br' ? '<br>' : `<${tag}>x</${tag}>`), true, tag);
  }
  for (const tag of ['b', 'i', 's', 'code', 'pre', 'hr', 'h4', 'h5', 'h6', 'section', 'article', 'button', 'input']) {
    assert.equal(isAllowedHtml(`<${tag}>x</${tag}>`), false, tag);
  }
});

test('refuses a value that is not a string', () => {
  assert.equal(isAllowedHtml(undefined), false);
  assert.equal(isAllowedHtml(null), false);
  assert.equal(isAllowedHtml(42), false);
});

test('reads a pathological document in linear time', () => {
  const started = Date.now();
  isAllowedHtml('<a' + ' '.repeat(200_000) + 'x');
  isAllowedHtml('<a' + ' x="y"'.repeat(50_000) + ' '.repeat(50_000) + 'z');
  isAllowedHtml('<p>'.repeat(100_000));
  assert.ok(Date.now() - started < 2_000, `took ${Date.now() - started} ms`);
});

// The real documents live in private repositories, so these read them from a
// checkout beside this one and skip, saying why, where there is none: set
// SCADABLE_WORKSPACE to the directory that holds the engine and policy checkouts.
const here = dirname(fileURLToPath(import.meta.url));
const workspace = process.env.SCADABLE_WORKSPACE ?? resolve(here, '..', '..', '..');
const golden = join(workspace, 'engine', 'tests', 'contract', 'v1', 'golden', 'business_basics');
const contract = join(workspace, 'policy', 'tests', 'contract', 'html', 'allowlist.json');

test(
  "accepts every one of engine's golden Business Basics documents",
  { skip: !existsSync(golden) && `no engine checkout at ${golden}; set SCADABLE_WORKSPACE to run it` },
  () => {
    const documents = readdirSync(golden).flatMap((scenario) => {
      const published = join(golden, scenario, 'public');
      return existsSync(published)
        ? readdirSync(published)
            .filter((file) => file.endsWith('.html'))
            .map((file) => join(published, file))
        : [];
    });
    assert.ok(documents.length > 0, `no documents under ${golden}`);
    for (const document of documents) {
      assert.equal(isAllowedHtml(readFileSync(document, 'utf8')), true, document);
    }
  },
);

test(
  "agrees with policy's allowlist contract",
  { skip: !existsSync(contract) && `no policy checkout at ${contract}; set SCADABLE_WORKSPACE to run it` },
  () => {
    const { allowlist, cases } = JSON.parse(readFileSync(contract, 'utf8'));
    assert.deepEqual([...allowlist.tags].sort(), TAGS);
    assert.deepEqual(allowlist.attributes, { '*': [], a: ['href'] });
    assert.equal(allowlist.link_rel, 'noopener noreferrer');
    assert.deepEqual([...allowlist.url_schemes].sort(), ['http', 'https', 'mailto']);
    assert.equal(allowlist.url_relative, 'deny');
    // Whatever policy's sanitizer produces, policy would publish, so it must pass.
    for (const { name, output } of cases) {
      assert.equal(isAllowedHtml(output), true, name);
    }
  },
);
