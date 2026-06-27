/**
 * Framework detection and MINIMAL context collection.
 *
 * Privacy is the whole point of this product, so we collect the least possible:
 * only `./package.json` dependency NAMES and a shallow yes/no listing of a few
 * well-known directories. We never read or transmit source files, and never
 * touch `.env*` or anything secret-shaped. The single exception is opt-in
 * `--patch <file>` mode, where we read exactly that one file and refuse to
 * upload it if it looks like it carries secrets.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Framework = 'next-app' | 'next-pages' | 'react';

export interface RepoContext {
  framework: Framework;
  /** Dependency names from package.json (no versions, no contents). */
  deps: string[];
  /** Which of a few known paths exist. Short path strings, never contents. */
  paths: string[];
  /** A non-fatal note to show the user (e.g. a fallback was used). */
  warning?: string;
}

/** The only paths we probe for. Booleans about layout, not file contents. */
const KNOWN_PATHS = ['app', 'src/app', 'pages', 'src/pages', 'src', 'app/layout.tsx'] as const;

/**
 * Read `./package.json` and the shallow directory layout, and decide which web
 * framework this repo uses. Reads nothing else.
 */
export function detectRepo(cwd: string): RepoContext {
  const pkgPath = join(cwd, 'package.json');
  if (!existsSync(pkgPath)) {
    throw new Error(
      'No package.json found here. Run this inside your web app, next to its package.json.',
    );
  }

  let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  try {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  } catch {
    throw new Error('Could not parse package.json. Is it valid JSON?');
  }

  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  const has = (rel: string) => existsSync(join(cwd, rel));
  const paths = KNOWN_PATHS.filter(has);

  const hasNext = deps.includes('next');
  const hasReact = deps.includes('react');

  let framework: Framework;
  let warning: string | undefined;

  if (hasNext) {
    if (has('app') || has('src/app')) framework = 'next-app';
    else if (has('pages') || has('src/pages')) framework = 'next-pages';
    else framework = 'next-app';
  } else if (hasReact) {
    framework = 'react';
  } else {
    framework = 'react';
    warning = 'No "next" or "react" dependency found; assuming a generic React app.';
  }

  return { framework, deps, paths, warning };
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
