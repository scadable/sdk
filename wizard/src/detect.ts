/**
 * Framework detection and MINIMAL context collection.
 *
 * Privacy is the whole point of this product, so we collect the least possible:
 * only `./package.json` dependency NAMES and a shallow yes/no listing of a few
 * well-known directories and config files. We never read or transmit source
 * files, and never touch `.env*` or anything secret-shaped. The single exception
 * is opt-in `--patch <file>` mode, where we read exactly that one file and refuse
 * to upload it if it looks like it carries secrets.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every framework the wizard knows how to scaffold. Each maps to exactly one
 * `@scadable/*` package (see scaffold.ts). `html` is the universal fallback for
 * a static site or an unknown stack, and uses the CDN embed instead of a package.
 */
export type Framework =
  | 'next-app'
  | 'next-pages'
  | 'astro'
  | 'vue'
  | 'nuxt'
  | 'svelte'
  | 'sveltekit'
  | 'vite-react'
  | 'remix'
  | 'gatsby'
  | 'html';

export interface RepoContext {
  framework: Framework;
  /** Dependency names from package.json (no versions, no contents). */
  deps: string[];
  /** Which of a few known paths exist. Short path strings, never contents. */
  paths: string[];
  /** A non-fatal note to show the user (e.g. a fallback was used). */
  warning?: string;
}

/**
 * The only paths we probe for. Booleans about layout, not file contents. Config
 * files are listed by base name; `hasConfig` tries the usual extensions.
 */
const KNOWN_DIRS = ['app', 'src/app', 'pages', 'src/pages', 'src/routes', 'src', 'public'] as const;
const KNOWN_CONFIGS = [
  'next.config',
  'astro.config',
  'nuxt.config',
  'svelte.config',
  'vite.config',
  'remix.config',
  'gatsby-config',
] as const;
const KNOWN_FILES = ['app/layout.tsx', 'index.html'] as const;

/** True if `${base}.{js,mjs,cjs,ts}` exists in `cwd`. */
function hasConfig(cwd: string, base: string): boolean {
  return ['js', 'mjs', 'cjs', 'ts'].some((ext) => existsSync(join(cwd, `${base}.${ext}`)));
}

/**
 * Read `./package.json` (if present) and the shallow directory layout, and decide
 * which web framework this repo uses. Reads nothing else. A folder with no
 * package.json is treated as a plain static site (the `html` fallback) as long as
 * it has an `index.html`; otherwise we refuse, so the wizard never runs in the
 * wrong directory.
 */
export function detectRepo(cwd: string): RepoContext {
  const has = (rel: string) => existsSync(join(cwd, rel));
  const pkgPath = join(cwd, 'package.json');
  const hasPkg = existsSync(pkgPath);

  // No package.json: only a plain-HTML site is a sensible target here.
  if (!hasPkg) {
    if (has('index.html') || has('public/index.html')) {
      return {
        framework: 'html',
        deps: [],
        paths: probePaths(cwd, has),
        warning: 'No package.json found; setting up the universal embed for a static site.',
      };
    }
    throw new Error(
      'No package.json or index.html found here. Run this inside your web app, next to its package.json.',
    );
  }

  let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  try {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  } catch {
    throw new Error('Could not parse package.json. Is it valid JSON?');
  }

  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  const dep = (name: string) => deps.includes(name);
  const depPrefix = (prefix: string) => deps.some((d) => d.startsWith(prefix));
  const paths = probePaths(cwd, has);

  let framework: Framework | undefined;
  let warning: string | undefined;

  // Order matters: meta-frameworks before the libraries they build on.
  if (dep('next')) {
    // App Router vs Pages Router by which directory the project actually uses.
    if (has('app') || has('src/app')) framework = 'next-app';
    else if (has('pages') || has('src/pages')) framework = 'next-pages';
    else framework = 'next-app';
  } else if (dep('astro')) {
    framework = 'astro';
  } else if (dep('nuxt') || dep('nuxt3')) {
    framework = 'nuxt';
  } else if (dep('vue')) {
    framework = 'vue';
  } else if (dep('@sveltejs/kit')) {
    framework = 'sveltekit';
  } else if (dep('svelte')) {
    framework = 'svelte';
  } else if (depPrefix('@remix-run/')) {
    framework = 'remix';
  } else if (dep('gatsby')) {
    framework = 'gatsby';
  } else if (dep('react-scripts') || (dep('vite') && dep('react')) || dep('react')) {
    // Vite + React, Create React App (react-scripts), or any generic React app.
    framework = 'vite-react';
  }

  // Nothing recognized: if there is an index.html, treat it as a static site;
  // otherwise assume a generic React app so the user still gets a working page.
  if (!framework) {
    if (has('index.html') || has('public/index.html')) {
      framework = 'html';
      warning = 'No known framework dependency found; using the universal embed for a static site.';
    } else {
      framework = 'vite-react';
      warning = 'No known framework dependency found; assuming a generic React app.';
    }
  }

  return { framework, deps, paths, warning };
}

/** Shallow yes/no listing of known dirs, config files, and files. Strings only. */
function probePaths(cwd: string, has: (rel: string) => boolean): string[] {
  const dirs = KNOWN_DIRS.filter(has);
  const configs = KNOWN_CONFIGS.filter((base) => hasConfig(cwd, base)).map((base) => `${base}.*`);
  const files = KNOWN_FILES.filter(has);
  return [...dirs, ...configs, ...files];
}

/**
 * Heuristics for "this file looks like it holds a secret". Deliberately broad:
 * in patch mode we would rather refuse a harmless file than upload a real key.
 */
const SECRET_PATTERNS: RegExp[] = [
  /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/,
  /\bapi[_-]?key\s*[:=]/i,
  /\b(?:access|secret)[_-]?key\s*[:=]/i,
  /\bsecret\b/i,
  /\bpassword\s*[:=]/i,
  /\b(?:auth|access|bearer)[_-]?token\s*[:=]/i,
  /\bAKIA[0-9A-Z]{16}\b/,
];

/** True if `contents` matches any secret heuristic. */
export function looksLikeSecret(contents: string): boolean {
  return SECRET_PATTERNS.some((re) => re.test(contents));
}
