/**
 * The client-side scaffold registry.
 *
 * Onboarding lives in the wizard now: for every (framework, document type) this
 * module returns the package to install, the file(s) to write, and where the page
 * ends up. The create path is fully deterministic and needs none of the customer's
 * source, just their public token. Each framework maps to exactly one
 * `@scadable/*` package; plain HTML uses the CDN embed (no install).
 *
 * Live by design: every scaffold renders a component (or embed) that pulls the
 * customer's current document straight from the SCADABLE API, so publishing an
 * edit never means a redeploy on their side.
 */
import type { Framework } from './detect';

/** The document types the wizard can scaffold. Matches the SCADABLE API `doc_type`. */
export type DocType = 'privacy_policy' | 'terms_of_use';

/** A single file the wizard will create. */
export interface ScaffoldFile {
  path: string;
  contents: string;
}

/** Where one document's page ends up, for the closing "here is your page" note. */
export interface ScaffoldRoute {
  docType: DocType;
  /** A short human hint: a real route ("/privacy") or a wiring instruction. */
  hint: string;
}

/** The full set of changes for a framework + the chosen document types. */
export interface ScaffoldPlan {
  /** The single `@scadable/*` package to install, or null for the CDN embed. */
  install: string | null;
  files: ScaffoldFile[];
  routes: ScaffoldRoute[];
  /**
   * For the HTML/embed fallback: snippets the user can paste into an existing
   * page. Empty for package-based frameworks.
   */
  snippets: string[];
}

/** Per-document naming used across the component-based frameworks. */
interface DocMeta {
  /** Page <title> and human label. */
  title: string;
  /** URL/file slug, e.g. "privacy". */
  slug: string;
  /** The doc-type-locked component/export name, e.g. "PrivacyPolicy". */
  component: string;
}

const DOC: Record<DocType, DocMeta> = {
  privacy_policy: { title: 'Privacy Policy', slug: 'privacy', component: 'PrivacyPolicy' },
  terms_of_use: { title: 'Terms of Use', slug: 'terms', component: 'TermsOfUse' },
};

/** The npm package each framework installs. `html` uses the CDN embed (null). */
const PACKAGE: Record<Framework, string | null> = {
  'next-app': '@scadable/next',
  'next-pages': '@scadable/next',
  astro: '@scadable/astro',
  vue: '@scadable/vue',
  nuxt: '@scadable/vue',
  svelte: '@scadable/svelte',
  sveltekit: '@scadable/svelte',
  'vite-react': '@scadable/react',
  remix: '@scadable/react',
  gatsby: '@scadable/react',
  html: null,
};

/** The package the wizard installs for `framework` (null = CDN embed). */
export function packageFor(framework: Framework): string | null {
  return PACKAGE[framework];
}

// Shared page chrome so every framework renders the document the same width.
const JSX_STYLE = "{{ maxWidth: 820, margin: '0 auto', padding: '40px 20px' }}";
const CSS_STYLE = 'max-width: 820px; margin: 0 auto; padding: 40px 20px;';
const EMBED_SRC = 'https://cdn.jsdelivr.net/npm/@scadable/embed/dist/embed.js';

/** What one framework produces for one document type. */
interface OneScaffold {
  files: ScaffoldFile[];
  route: ScaffoldRoute;
  snippet?: string;
}

/** Build the scaffold for a single (framework, docType). */
function scaffoldOne(framework: Framework, docType: DocType, publicId: string): OneScaffold {
  const doc = DOC[docType];
  const route = (hint: string): ScaffoldRoute => ({ docType, hint });

  switch (framework) {
    // ── Next.js App Router: a Server Component page (SEO-baked + live). ──────
    case 'next-app': {
      const contents = `import { ${doc.component} } from '@scadable/next';

export const metadata = { title: '${doc.title}' };

export default function ${doc.component}Page() {
  return (
    <main style=${JSX_STYLE}>
      <${doc.component} token="${publicId}" />
    </main>
  );
}
`;
      return { files: [{ path: `app/${doc.slug}/page.tsx`, contents }], route: route(`/${doc.slug}`) };
    }

    // ── Next.js Pages Router: fetch on the server, render the fragment. ──────
    case 'next-pages': {
      const contents = `import { fetchPolicy, type Policy } from '@scadable/next';

export async function getServerSideProps() {
  const policy = await fetchPolicy('${publicId}', { docType: '${docType}' });
  return { props: { policy } };
}

export default function ${doc.component}Page({ policy }: { policy: Policy }) {
  return (
    <main style=${JSX_STYLE}>
      <div className="scadable-policy" dangerouslySetInnerHTML={{ __html: policy.html }} />
    </main>
  );
}
`;
      return { files: [{ path: `pages/${doc.slug}.tsx`, contents }], route: route(`/${doc.slug}`) };
    }

    // ── Astro: file-based page importing the .astro component. ───────────────
    case 'astro': {
      const contents = `---
import ${doc.component} from '@scadable/astro/${doc.component}.astro';
---
<main style="${CSS_STYLE}">
  <${doc.component} token="${publicId}" />
</main>
`;
      return { files: [{ path: `src/pages/${doc.slug}.astro`, contents }], route: route(`/${doc.slug}`) };
    }

    // ── Nuxt: file-based page under pages/. ──────────────────────────────────
    case 'nuxt': {
      const contents = vueSfc(doc.component, publicId);
      return { files: [{ path: `pages/${doc.slug}.vue`, contents }], route: route(`/${doc.slug}`) };
    }

    // ── Vue (Vite SPA): a view the user adds to their router. ────────────────
    case 'vue': {
      const contents = vueSfc(doc.component, publicId);
      return {
        files: [{ path: `src/views/${doc.component}View.vue`, contents }],
        route: route(`add <${doc.component}View /> to your router (e.g. a /${doc.slug} route)`),
      };
    }

    // ── SvelteKit: file-based route. ─────────────────────────────────────────
    case 'sveltekit': {
      const contents = svelteComponent(doc.component, publicId);
      return {
        files: [{ path: `src/routes/${doc.slug}/+page.svelte`, contents }],
        route: route(`/${doc.slug}`),
      };
    }

    // ── Svelte (Vite SPA): a component the user adds to their router. ────────
    case 'svelte': {
      const contents = svelteComponent(doc.component, publicId);
      return {
        files: [{ path: `src/lib/${doc.component}Page.svelte`, contents }],
        route: route(`add <${doc.component}Page /> to your router (e.g. a /${doc.slug} route)`),
      };
    }

    // ── Remix: file-based route under app/routes/. ───────────────────────────
    case 'remix': {
      const contents = reactPage(doc.component, publicId, `${doc.component}Route`);
      return { files: [{ path: `app/routes/${doc.slug}.tsx`, contents }], route: route(`/${doc.slug}`) };
    }

    // ── Gatsby: file-based page under src/pages/. ────────────────────────────
    case 'gatsby': {
      const contents = reactPage(doc.component, publicId, `${doc.component}Page`);
      return { files: [{ path: `src/pages/${doc.slug}.tsx`, contents }], route: route(`/${doc.slug}`) };
    }

    // ── Generic React (Vite, CRA): a page the user adds to their router. ─────
    case 'vite-react': {
      const contents = reactPage(doc.component, publicId, `${doc.component}Page`);
      return {
        files: [{ path: `src/${doc.component}Page.tsx`, contents }],
        route: route(`add <${doc.component}Page /> to your router (e.g. a /${doc.slug} route)`),
      };
    }

    // ── Plain HTML / unknown: a standalone page + a paste-anywhere snippet. ──
    case 'html': {
      const snippet = embedSnippet(docType, publicId);
      const contents = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${doc.title}</title>
  </head>
  <body>
    <main style="${CSS_STYLE}">
      ${snippet.replace(/\n/g, '\n      ')}
    </main>
  </body>
</html>
`;
      return {
        files: [{ path: `${doc.slug}.html`, contents }],
        route: route(`${doc.slug}.html (open it, or link to it from your nav)`),
        snippet,
      };
    }
  }
}

/** A Vue single-file component that renders the doc-type-locked component. */
function vueSfc(component: string, publicId: string): string {
  return `<script setup lang="ts">
import { ${component} } from '@scadable/vue';
</script>

<template>
  <main style="${CSS_STYLE}">
    <${component} token="${publicId}" />
  </main>
</template>
`;
}

/** A Svelte component that renders the doc-type-locked component. */
function svelteComponent(component: string, publicId: string): string {
  return `<script lang="ts">
  import { ${component} } from '@scadable/svelte';
</script>

<main style="${CSS_STYLE}">
  <${component} token="${publicId}" />
</main>
`;
}

/** A React page component (Vite / CRA / Remix / Gatsby) for `@scadable/react`. */
function reactPage(component: string, publicId: string, fnName: string): string {
  return `import { ${component} } from '@scadable/react';

export default function ${fnName}() {
  return (
    <main style=${JSX_STYLE}>
      <${component} token="${publicId}" />
    </main>
  );
}
`;
}

/** The universal CDN embed: a tagged div plus the loader script. */
function embedSnippet(docType: DocType, publicId: string): string {
  return `<div class="scadable-policy" data-token="${publicId}" data-doc-type="${docType}"></div>
<script src="${EMBED_SRC}" defer></script>`;
}

/**
 * Build the full scaffold for a framework and one or more document types. Files
 * across document types are concatenated; the install package is the same for all
 * of them (deduped to one).
 */
export function buildScaffold(
  framework: Framework,
  docTypes: DocType[],
  publicId: string,
): ScaffoldPlan {
  const files: ScaffoldFile[] = [];
  const routes: ScaffoldRoute[] = [];
  const snippets: string[] = [];

  for (const docType of docTypes) {
    const one = scaffoldOne(framework, docType, publicId);
    files.push(...one.files);
    routes.push(one.route);
    if (one.snippet) snippets.push(one.snippet);
  }

  return { install: packageFor(framework), files, routes, snippets };
}
