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
