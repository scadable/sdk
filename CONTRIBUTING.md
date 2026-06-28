# Contributing

This is a public npm workspaces monorepo. Each platform lives in its own folder. The
shared rule for everything here: one public token in, an always-current document out, with
no secrets and no server code on the customer's side. Keep new work inside that line.

Read [docs/architecture.md](./docs/architecture.md) before adding a package, so your
adapter matches the contract the rest of the family follows.

## Repo conventions

- The eight `@scadable/*` folders are npm workspaces, listed in the root
  [`package.json`](./package.json) under `workspaces` and built by `npm run build`.
- Every JavaScript package depends on [`@scadable/core`](./core) for the fetch and types.
  Do not re-implement the request; import `fetchPolicy`.
- Components are token-first: expose `<PrivacyPolicy>` and `<TermsOfUse>` (token-only) plus
  a generic `<ScadablePolicy docType="...">`. Never require more than the token for the
  common case.
- Frameworks that can render on the server use the hybrid render (bake then refresh).
  Client-only platforms fetch on mount and accept an optional `initialHtml`.
- No em dashes in any text a user reads (UI copy, console output, package descriptions,
  these docs).
- `wordpress/`, `shopify/`, and `square/` are not npm packages. They ship through their own
  platform stores and are not workspaces.

## Develop

```bash
npm install            # install every workspace (single root node_modules)
npm run build          # build all packages
npm run typecheck      # type-check all packages

npm run build -w @scadable/next   # one package
npm run dev   -w @scadable/core   # tsup --watch
```

Do not commit `dist/` or `node_modules/` (both are gitignored). The publish workflow builds
fresh from source.

## Add a new platform package (npm)

Use an existing package as the template. [`core/`](./core) shows the minimal build setup;
[`next/`](./next) shows the hybrid-render component pattern; [`react/`](./react) shows the
client-only pattern.

1. Create the folder, for example `solid/`, and a `package.json` that copies the
   conventions:
   - `"name": "@scadable/solid"`, a clear `description` (no em dashes), `"license": "MIT"`.
   - `"type": "module"`, the `main` / `module` / `types` / `exports` map, and
     `"files": ["dist", "README.md"]` exactly as the other packages have them.
   - `"dependencies": { "@scadable/core": "^x.y.z" }` and the framework as a
     `peerDependency`.
   - Scripts: `build` (tsup), `dev` (tsup --watch), `typecheck` (tsc --noEmit),
     `prepublishOnly` (npm run build).
   - `"publishConfig": { "access": "public" }` and the `repository.directory` pointing at
     your folder.
2. Implement the adapter in `src/`, importing `fetchPolicy` from `@scadable/core`. Match the
   component API (`PrivacyPolicy`, `TermsOfUse`, `ScadablePolicy`) and the hybrid-or-client
   render rule for your platform.
3. Register the workspace: add the folder name to `workspaces` in the root
   [`package.json`](./package.json).
4. Register it in the publish loop: add the folder name to the `for dir in ...` list in
   [`.github/workflows/publish.yml`](./.github/workflows/publish.yml).
5. Register the package as an npm Trusted Publisher (one-time, see below). A new package
   cannot publish until this is done.
6. Write the package's own `README.md` (the per-package usage doc) and add a row to the
   "Pick your platform" table in the root [README](./README.md) and to
   [docs/platforms.md](./docs/platforms.md).
7. `npm install` at the root, then `npm run build` and `npm run typecheck` to confirm the
   new workspace is wired in.

## Add a new platform package (not npm)

For a store-distributed plugin (the WordPress, Shopify, and Square pattern):

1. Create the folder (`wordpress/`, `shopify/`, `square/`, or similar). Do not add it to
   `workspaces` or to the publish loop; it is not an npm package.
2. Reuse the public API contract and, where the host has no build step, the universal embed
   snapshot plus live-refresh approach. Keep the token as the only required input.
3. Follow that platform's own packaging and submission process (the WordPress plugin
   directory, the Shopify App Store, the Square embed flow). Document its release steps in
   the folder's own README.
4. Add a row to the root README table and to [docs/platforms.md](./docs/platforms.md).

## Release and publish (npm packages)

Publishing uses npm Trusted Publishing over OIDC. There is no `NPM_TOKEN` and no 2FA prompt:
npm verifies the GitHub Actions workflow's identity directly. The workflow is
[`.github/workflows/publish.yml`](./.github/workflows/publish.yml).

To release:

1. Bump the `version` in the changed package's `package.json`. If you changed
   `@scadable/core`, bump it and bump the `@scadable/core` dependency range in every package
   that should pick up the change.
2. Open a pull request, get it reviewed, and merge to `main`.
3. Publish a GitHub Release (Releases, then Draft a new release, choose a tag, Publish). You
   can also run the workflow manually from the Actions tab (`workflow_dispatch`).

On a published release the workflow checks out `main`, installs, runs `npm run build`, then
walks `core next react astro vue svelte embed wizard` and, for each, compares the
`package.json` version against npm. New versions are published with `npm publish --access
public --provenance`; versions already on npm are skipped. So a release only publishes what
you bumped, and re-running it is safe.

### Register a Trusted Publisher (one-time per package)

A package can only publish through the workflow after it is registered as a Trusted
Publisher on npm:

1. Sign in to npmjs.com as a maintainer of the `@scadable` scope.
2. Open the package, then Settings, then Publishing access.
3. Add a GitHub Actions trusted publisher with:
   - Organization: `scadable`
   - Repository: `sdk`
   - Workflow filename: `publish.yml`
4. Save. The next release that contains a new version of this package will publish it with
   no token.

For a brand-new package name that does not exist on npm yet, do the first publish so the
package exists, then add the trusted publisher. The simplest path is to publish `0.0.0` (or
your first version) once locally as a maintainer, configure trusted publishing, and let the
workflow take over from there.

## Pull requests

- Keep a change scoped to one concern. Adjacent cleanup goes in its own PR.
- Run `npm run build` and `npm run typecheck` before opening the PR.
- Update the root README table, [docs/platforms.md](./docs/platforms.md), and the package's
  own README when you add or rename a package.
- Do not commit secrets, `.env` files, `dist/`, or `node_modules/`.
