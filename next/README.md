# @scadable/privacy-next

Render your always-current privacy policy in a Next.js app. You publish the policy once
in the SCADABLE app; this component shows whatever version is currently published, so
updating your policy never means a redeploy on your side.

## Install

```bash
npm install @scadable/privacy-next
```

## Use (App Router)

Drop the component on your privacy page. It is a Server Component, so the policy text is
server-rendered (good for SEO) and cached.

```tsx
import { PrivacyPolicy } from '@scadable/privacy-next';

export default function PrivacyPage() {
  return (
    <main>
      <PrivacyPolicy token="YOUR_PUBLIC_TOKEN" />
    </main>
  );
}
```

Get `YOUR_PUBLIC_TOKEN` from the SCADABLE app after you publish a policy.

### Options

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `token` | `string` | required | Your scope's public token. |
| `className` | `string` | none | Class on the wrapper element. |
| `showVersion` | `boolean` | `false` | Show a "Version N, last updated ..." line. |
| `revalidate` | `number \| false` | `3600` | Next.js ISR seconds. `false` = always fresh. |
| `docType` | `string` | `"privacy_policy"` | Which document to render. |
| `baseUrl` | `string` | `https://api.scadable.com` | Override the API base. |

## Just the data

If you want to render it yourself:

```ts
import { fetchPolicy } from '@scadable/privacy-next';

const policy = await fetchPolicy('YOUR_PUBLIC_TOKEN');
// { scope_name, domain, version, effective_date, updated_at, html }
```

`policy.html` is an HTML content fragment with scoped styles (class `scadable-policy`),
safe to inject inline.

## Notes

- This package only talks to the public SCADABLE API. It stores no secrets.
- The rendered HTML is your own published policy content from the SCADABLE API.
