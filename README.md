# SCADABLE SDK

Public client libraries for SCADABLE. Each framework lives in its own folder.

| Package | Folder | What it does |
| --- | --- | --- |
| [`@scadable/privacy`](./next) | [`next/`](./next) | Render your always-current privacy policy in a Next.js app. |
| [`@scadable/wizard`](./wizard) | [`wizard/`](./wizard) | The `npx` setup wizard. Wires SCADABLE into your codebase (privacy policy now, more later). |

These libraries only ever talk to the public SCADABLE API (`https://api.scadable.com`).
They contain no secrets and no server code.

## How it works

You set up and publish your privacy policy in the SCADABLE app. The app gives you a
public token. These libraries fetch the currently published policy for that token and
render it, so the page your users see is always the version you last published, with no
redeploy on your side when you update it.

## Develop

```bash
npm install
npm run build       # builds every package
npm run typecheck
```
