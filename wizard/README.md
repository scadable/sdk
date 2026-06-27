# @scadable/wizard

A one-time setup wizard that wires your published SCADABLE privacy policy into your
codebase. Publish your policy in the SCADABLE app, copy the install command from
Settings, and run it in your repo:

```bash
npx @scadable/wizard@latest --token <TEMP_TOKEN>
```

The wizard verifies your token, detects your web framework, asks the SCADABLE API for a
tailored plan, then installs [`@scadable/privacy`](../next) and creates your privacy
page. After this, your page always renders the version you last published, with no
redeploy when you update it.

## What it sends

Your code stays private. The wizard reads only `./package.json` (dependency names) and a
shallow yes/no listing of a few known folders (`app`, `src/app`, `pages`, ...). It never
reads or transmits your source, and never touches `.env*` files. The one exception is
opt-in `--patch <file>` mode, which reads exactly that one file, and refuses to upload it
if it looks like it contains secrets.

## Options

| Flag | Default | What it does |
| --- | --- | --- |
| `--token <token>` | required | Install token from the SCADABLE app. |
| `--api <url>` | `https://api.scadable.com` | API base. |
| `--dry-run` | off | Show the plan, write nothing. |
| `--yes`, `-y` | off | Skip confirmation prompts (non-interactive). |
| `--patch <file>` | off | Patch an existing file instead of creating a new page. |
| `--help`, `-h` | | Show usage. |

The package manager is detected from your lockfile (`pnpm-lock.yaml` -> pnpm,
`yarn.lock` -> yarn, otherwise npm).

## Notes

- This package only talks to the public SCADABLE API. It stores no secrets.
- It is meant to be run once, via `npx`, to connect a repo.
