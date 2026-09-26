# @scadable/core

Shared fetch client + types for the SCADABLE document SDK. The framework packages
(`@scadable/next`, `@scadable/react`, `@scadable/astro`, `@scadable/vue`,
`@scadable/svelte`) all build on this so there is one source of truth for how a
published document is loaded.

You usually do not install this directly - install your framework package instead.

```ts
import { fetchPolicy } from '@scadable/core';

const policy = await fetchPolicy('YOUR_PUBLIC_TOKEN', { docType: 'privacy_policy' });
// -> { html, version, updated_at, doc_type, scope_name, domain, effective_date }
```

`fetchPolicy(token, options)` calls `GET https://policy.scadable.com/policy/{token}?doc_type=...&format=json`.

Options:
- `docType` - which document (`"privacy_policy"`, `"terms_of_use"`, ...). Default `"privacy_policy"`.
- `baseUrl` - override the API base. Default `https://policy.scadable.com`.
- `revalidate` - Next.js ISR seconds (ignored elsewhere); pass `false` for an always-fresh fetch.

## Published documents

A document approved in the SCADABLE app is also published at
`https://files.scadable.com/{tenant}/{document}.html`. `fetchDocument` reads it:

```ts
import { fetchDocument, documentSlug } from '@scadable/core';

const doc = await fetchDocument({ tenant: 'YOUR_TENANT', document: documentSlug('privacy_policy') });
// -> { html, url }
```

`fetchDocument({ tenant, document }, options)` calls
`GET https://files.scadable.com/{tenant}/{document}.html` and returns `{ html, url }`.

- `tenant` must match `^[A-Za-z0-9_-]{1,128}$` and `document` must match
  `^[a-z0-9][a-z0-9-]*$`; anything else is rejected before a request is made.
- The response must be `text/html`, or the call rejects.
- `html` is safe to insert into your page. It is the document when the document passes
  `isAllowedHtml`, and a plain link to `url` (with a console warning) when it does not.

Options:
- `baseUrl` - override the base. Default `https://files.scadable.com`.
- `revalidate` - the same as for `fetchPolicy`.

Also exported:
- `documentUrl({ tenant, document }, { baseUrl })` - the URL `fetchDocument` requests.
- `documentSlug(docType)` - the slug a document type is published under:
  `documentSlug('privacy_policy')` is `'privacy-policy'`.
- `isAllowedHtml(html)` - whether HTML is made only of what a SCADABLE document may contain:
  the tags `h1` `h2` `h3` `p` `br` `strong` `em` `u` `ul` `ol` `li` `blockquote` `a`, only
  `href` and `rel` on a link and no attribute anywhere else, and links only to http, https
  or mailto. It checks and never cleans.
- `DEFAULT_DOCUMENT_BASE_URL` - `https://files.scadable.com`.
