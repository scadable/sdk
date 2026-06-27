/**
 * Side-effecting steps: install the dependency with the repo's own package
 * manager, and write/patch the files from the plan.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import type { PlanEdit } from './api';

export type PackageManager = 'pnpm' | 'yarn' | 'npm';

/** Pick the package manager from whichever lockfile is present. Defaults to npm. */
export function detectPackageManager(cwd: string): PackageManager {
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

const INSTALL_VERB: Record<PackageManager, string> = {
  pnpm: 'add',
  yarn: 'add',
  npm: 'install',
};

/**
 * Resolve the package specifiers to install. The server lists them in
 * `plan.install`; we tolerate either bare specs (["@scadable/privacy"]) or full
 * command strings ("npm install @scadable/privacy"), always include the core
 * package, and de-duplicate.
 */
export function resolvePackages(install: string[]): string[] {
  const noise = /^(?:npm|yarn|pnpm|install|add|i|--save|-S|-D|--save-dev|--dev)$/;
  const specs = install
    .flatMap((line) => line.split(/\s+/))
    .map((token) => token.trim())
    .filter((token) => token && !noise.test(token));
  return [...new Set(['@scadable/privacy', ...specs])];
}

/** The command we will run, formatted for display. */
export function formatInstall(pm: PackageManager, packages: string[]): string {
  return `${pm} ${INSTALL_VERB[pm]} ${packages.join(' ')}`;
}

/** Install `packages` in `cwd` using `pm`, streaming its output to the user. */
export function runInstall(cwd: string, pm: PackageManager, packages: string[]): void {
  execFileSync(pm, [INSTALL_VERB[pm], ...packages], {
    cwd,
    stdio: 'inherit',
    // Windows resolves npm/yarn/pnpm through the shell.
    shell: process.platform === 'win32',
  });
}

/** Whether the file an edit targets already exists on disk. */
export function editTargetExists(cwd: string, edit: PlanEdit): boolean {
  return existsSync(join(cwd, edit.path));
}

/** Create parent directories as needed and write the edit's contents. */
export function writeEdit(cwd: string, edit: PlanEdit): void {
  const abs = join(cwd, edit.path);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, edit.contents, 'utf8');
}
