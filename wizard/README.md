# @scadable/wizard

The zero-friction setup wizard for SCADABLE. One command, one token, done: it
detects your framework and wires your always-current legal documents (privacy
policy, terms of use, and more) into your app, pulled live from SCADABLE. Publish
a document in the SCADABLE app, copy the install command from Settings, and run it
in your repo:

```bash
npx @scadable/wizard@latest --token <TEMP_TOKEN>
```

The wizard verifies your token, detects your web framework, installs the matching
`@scadable/*` plugin (or sets up the universal CDN embed for a static site), and
creates your page(s). After this, every page always renders the version you last
published, with no redeploy when you update it.

## Frameworks

The wizard detects your stack automatically and scaffolds the right package:

| Stack | Package it installs | Where the page goes |
| --- | --- | --- |
| Next.js (App Router) | `@scadable/next` | `app/privacy/page.tsx` |
| Next.js (Pages Router) | `@scadable/next` | `pages/privacy.tsx` |
| Astro | `@scadable/astro` | `src/pages/privacy.astro` |
| Vue (Vite) | `@scadable/vue` | `src/views/PrivacyPolicyView.vue` |
| Nuxt | `@scadable/vue` | `pages/privacy.vue` |
| Svelte (Vite) | `@scadable/svelte` | `src/lib/PrivacyPolicyPage.svelte` |
| SvelteKit | `@scadable/svelte` | `src/routes/privacy/+page.svelte` |
| React: Vite / CRA | `@scadable/react` | `src/PrivacyPolicyPage.tsx` |
| React: Remix | `@scadable/react` | `app/routes/privacy.tsx` |
| React: Gatsby | `@scadable/react` | `src/pages/privacy.tsx` |
| Plain HTML / unknown | none (CDN embed) | `privacy.html` + a paste-anywhere snippet |

For file-based routers (Next, Astro, Nuxt, SvelteKit, Remix, Gatsby) the page is
live at `/privacy` (and `/terms`) right away. For the others the wizard tells you
the one line to add to your router.

## Document types

Pick what you want to add with `--doc-type`, or let the wizard ask:

```bash
npx @scadable/wizard@latest --token <TEMP_TOKEN> --doc-type both
```

- `privacy` creates your privacy policy page (`/privacy`).
- `terms` creates your terms of use page (`/terms`).
- `both` creates both.

New document types are a prop value, never a new package: the components are
generic (`<PrivacyPolicy token=... />`, `<TermsOfUse token=... />`, or
`<ScadablePolicy token=... docType=... />`).

## What it sends

Your code stays private. The wizard reads only `./package.json` (dependency names)
and a shallow yes/no listing of a few known folders and config files (`app`,
`src/app`, `pages`, `astro.config.*`, ...). It never reads or transmits your
source, and never touches `.env*` files. The one exception is opt-in
`--patch <file>` mode, which reads exactly that one file, and refuses to upload it
if it looks like it contains secrets.

## Options

| Flag | Default | What it does |
| --- | --- | --- |
| `--token <token>` | required | Install token from the SCADABLE app. |
| `--doc-type <type>` | ask | `privacy`, `terms`, or `both` (privacy if non-interactive). |
| `--api <url>` | `https://policy.scadable.com` | API base. |
| `--dry-run` | off | Show the plan, write nothing. |
| `--yes`, `-y` | off | Skip confirmation prompts (non-interactive). |
| `--patch <file>` | off | Add the privacy policy to an existing page instead of creating one. |
| `--help`, `-h` | | Show usage. |

The package manager is detected from your lockfile (`pnpm-lock.yaml` -> pnpm,
`yarn.lock` -> yarn, otherwise npm).

## Notes

- This package only talks to the public SCADABLE API. It stores no secrets.
- It is meant to be run once, via `npx`, to connect a repo.
- Using a strict Content-Security-Policy? Add `policy.scadable.com` to `connect-src`
  so the page can refresh live (it falls back to the baked copy if not).
