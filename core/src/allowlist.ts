/**
 * The HTML a SCADABLE document may contain, checked before anything is inserted.
 *
 * This mirrors the allowlist the policy service holds every document to: 13 tags,
 * `href` (and the `rel` its sanitizer forces) on a link and no attribute anywhere
 * else, and links only to http, https and mailto. Policy refuses a document that
 * is not already in that form, so a published document passes this check. It is
 * checked again here because the document is inserted into the customer's own
 * page, where an event handler would run as the customer's site and a style would
 * restyle it.
 *
 * It checks and never cleans: a cleaned document would be text nobody approved.
 * And it is a parser for a strict subset of HTML rather than a DOM walk, so the
 * same check runs in a browser, on a server that bakes the document into a page,
 * and in tests. Anything outside the subset is refused, because the subset is
 * where this check and a browser's parser are known to read the same elements.
 */

const TAGS = new Set([
  'a',
  'blockquote',
  'br',
  'em',
  'h1',
  'h2',
  'h3',
  'li',
  'ol',
  'p',
  'strong',
  'u',
  'ul',
]);

/** Tags that never take an end tag. */
const VOID = new Set(['br']);

const NO_ATTRIBUTES: ReadonlySet<string> = new Set();

/** `rel` is allowed because policy's sanitizer writes it onto every link. */
const ATTRIBUTES = new Map<string, ReadonlySet<string>>([['a', new Set(['href', 'rel'])]]);

const URL_SCHEMES = new Set(['http:', 'https:', 'mailto:']);

// Each pattern is sticky and only ever run from a position the loop below sets.
// Text is anything up to the next `<`: in a browser nothing else in text can open
// an element, and none of the allowed tags switch the parser out of reading text.
const TEXT = /[^<]+/y;
const START = /<([A-Za-z][A-Za-z0-9]*)((?:[\t\n\f\r ]+[A-Za-z][A-Za-z0-9-]*="[^"]*")*)[\t\n\f\r ]*(\/?)>/y;
const END = /<\/([A-Za-z][A-Za-z0-9]*)[\t\n\f\r ]*>/y;
const ATTRIBUTE = /[\t\n\f\r ]+([A-Za-z][A-Za-z0-9-]*)="([^"]*)"/g;

// Only the references a serializer writes in an attribute value. Any other `&`
// is refused rather than decoded, because a browser decodes the full table
// (`&colon;` is a colon) and a scheme read from half-decoded text is not the one
// a click would follow.
const REFERENCE = /&(?:(amp|lt|gt|quot|apos|nbsp);)?/g;
const REFERENCES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
};

/**
 * Whether `html` is made only of what a SCADABLE document may contain, so it can
 * be inserted as it is.
 *
 * False for anything else, including markup that is harmless but outside the
 * form the check reads with certainty: comments, unquoted or single-quoted
 * attributes, a solidus on anything but `<br/>`, and tags that do not close in
 * the order they opened.
 */
export function isAllowedHtml(html: string): boolean {
  if (typeof html !== 'string' || html.includes('\u0000')) return false;
  const open: string[] = [];
  let at = 0;
  while (at < html.length) {
    if (html[at] !== '<') {
      TEXT.lastIndex = at;
      if (TEXT.exec(html) === null) return false;
      at = TEXT.lastIndex;
      continue;
    }

    END.lastIndex = at;
    const end = END.exec(html);
    if (end) {
      // An end tag closes the element opened last, or the document is refused.
      // A stray one baked into a server-rendered page could close the page's own
      // elements around the document.
      if (open.pop() !== end[1].toLowerCase()) return false;
      at = END.lastIndex;
      continue;
    }

    START.lastIndex = at;
    const start = START.exec(html);
    if (!start) return false;
    const tag = start[1].toLowerCase();
    if (!TAGS.has(tag) || !attributesAllowed(tag, start[2])) return false;
    if (!VOID.has(tag)) {
      // A browser ignores the solidus on `<p/>` and leaves the paragraph open.
      if (start[3]) return false;
      open.push(tag);
    }
    at = START.lastIndex;
  }
  return open.length === 0;
}

function attributesAllowed(tag: string, source: string): boolean {
  const allowed = ATTRIBUTES.get(tag) ?? NO_ATTRIBUTES;
  const seen = new Set<string>();
  ATTRIBUTE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ATTRIBUTE.exec(source)) !== null) {
    const name = match[1].toLowerCase();
    if (!allowed.has(name) || seen.has(name)) return false;
    seen.add(name);
    const value = decoded(match[2]);
    if (value === null) return false;
    if (name === 'href' && !linkable(value)) return false;
  }
  return true;
}

function decoded(value: string): string | null {
  let refused = false;
  const text = value.replace(REFERENCE, (_all: string, name: string | undefined) => {
    if (name === undefined) {
      refused = true;
      return '';
    }
    return REFERENCES[name];
  });
  return refused ? null : text;
}

/**
 * Whether a link may point here: an absolute http, https or mailto URL.
 *
 * Read by the same URL parser a browser follows a link with, which drops tabs and
 * newlines and trims control characters before it reads a scheme (`java\tscript:`
 * is `javascript:` to it). A relative URL is refused, as policy refuses it: the
 * document is shown under paths it did not choose.
 */
function linkable(href: string): boolean {
  try {
    return URL_SCHEMES.has(new URL(href).protocol);
  } catch {
    return false;
  }
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttribute(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;');
}

/**
 * The HTML shown in place of a document that failed the check: one plain link to
 * where it is published, so a visitor can still read it there.
 */
export function linkTo(url: string, slug: string): string {
  const label = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
  return `<p><a href="${escapeAttribute(url)}" rel="noopener noreferrer">${escapeText(label)}</a></p>`;
}
