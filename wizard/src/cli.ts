/**
 * `@scadable/wizard` - a one-time setup wizard that wires your published
 * SCADABLE privacy policy into your codebase.
 *
 *   npx @scadable/wizard@latest --token <TEMP_TOKEN>
 *
 * It verifies your install token, detects your web framework, asks the SCADABLE
 * API for a tailored plan, then installs `@scadable/privacy` and writes your
 * privacy page. It only ever talks to the public SCADABLE API and collects the
 * minimum context (framework + dependency names + a shallow path listing).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { cancel, confirm, intro, isCancel, log, note, outro, spinner } from '@clack/prompts';
import pc from 'picocolors';

import {
  DEFAULT_API,
  getSession,
  postComplete,
  postPlan,
  WizardApiError,
  WizardNetworkError,
  type PlanEdit,
  type PlanRequest,
} from './api';
import { detectPackageManager, formatInstall, resolvePackages, runInstall, writeEdit } from './apply';
import { detectRepo, looksLikeSecret } from './detect';

interface CliArgs {
  token?: string;
  api: string;
  dryRun: boolean;
  yes: boolean;
  patch?: string;
  help: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { api: DEFAULT_API, dryRun: false, yes: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--token') args.token = argv[++i];
    else if (a === '--api') args.api = argv[++i];
    else if (a === '--patch') args.patch = argv[++i];
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--yes' || a === '-y') args.yes = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (a.startsWith('--token=')) args.token = a.slice('--token='.length);
    else if (a.startsWith('--api=')) args.api = a.slice('--api='.length);
    else if (a.startsWith('--patch=')) args.patch = a.slice('--patch='.length);
    else console.error(pc.yellow(`Ignoring unknown option: ${a}`));
  }
  return args;
}

const HELP = `
${pc.bold('@scadable/wizard')} - wire your SCADABLE privacy policy into this repo.

${pc.bold('Usage')}
  npx @scadable/wizard@latest --token <TEMP_TOKEN> [options]

${pc.bold('Options')}
  --token <token>   Install token from the SCADABLE app (required).
  --api <url>       API base. Default ${DEFAULT_API}.
  --dry-run         Show the plan, write nothing.
  --yes, -y         Skip confirmation prompts (non-interactive).
  --patch <file>    Patch an existing file instead of creating a new page.
  --help, -h        Show this help.
`;

/** Print an error and exit non-zero. */
function fail(message: string): never {
  log.error(message);
  process.exit(1);
}

/** Best-effort message out of an unknown thrown value. */
function reason(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** A short, indented preview of file contents so the box stays readable. */
function previewContents(contents: string, maxLines = 12): string {
  const lines = contents.split('\n');
  const shown = lines.slice(0, maxLines).map((l) => pc.dim('  ' + l));
  if (lines.length > maxLines) {
    shown.push(pc.dim(`  ... (${lines.length - maxLines} more lines)`));
  }
  return shown.join('\n');
}

/** Render the plan as a single boxed note. */
function showPlan(installCmd: string, edits: PlanEdit[], deterministic: boolean): void {
  const blocks: string[] = [`${pc.bold('Install')}\n  ${pc.cyan(installCmd)}`];
  for (const edit of edits) {
    const verb = edit.action === 'patch' ? 'Patch' : 'Create';
    blocks.push(`${pc.bold(`${verb} ${edit.path}`)}\n${previewContents(edit.contents)}`);
  }
  const source = deterministic
    ? pc.dim('Plan is deterministic (template-based).')
    : pc.dim('Plan was generated for your repo.');
  note(blocks.join('\n\n') + '\n\n' + source, 'Plan');
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(HELP);
    return;
  }

  intro(pc.bgCyan(pc.black(' SCADABLE privacy wizard ')));

  if (!args.token) {
    fail('Missing --token. Open Settings in the SCADABLE app and copy the install command.');
  }
  const token = args.token;
  const api = args.api.replace(/\/$/, '');
  const cwd = process.cwd();

  // 1. Verify the install token.
  const spin = spinner();
  spin.start('Verifying your install token');
  let session;
  try {
    session = await getSession(api, token);
  } catch (err) {
    spin.stop('Token check failed');
    if (err instanceof WizardApiError && err.status === 401) {
      fail(
        'Your install token expired. Reopen Settings in the SCADABLE app and copy a fresh command.',
      );
    }
    if (err instanceof WizardNetworkError) {
      fail(`Could not reach the SCADABLE API at ${api}. ${reason(err)}`);
    }
    fail(`Could not verify your token: ${reason(err)}`);
  }
  spin.stop(`Connected to ${pc.bold(session.scope_name)} (${session.domain})`);

  // 2. Detect the framework and build minimal, privacy-respecting context.
  let ctx;
  try {
    ctx = detectRepo(cwd);
  } catch (err) {
    fail(reason(err));
  }
  if (ctx.warning) log.warn(ctx.warning);

  // Opt-in patch mode reads exactly one file, and refuses if it looks secret.
  let mode: 'create' | 'patch' = 'create';
  let target: PlanRequest['target'];
  if (args.patch) {
    const abs = resolve(cwd, args.patch);
    if (!existsSync(abs)) {
      fail(`--patch file not found: ${args.patch}`);
    }
    const contents = readFileSync(abs, 'utf8');
    if (looksLikeSecret(contents)) {
      fail(
        `Refusing to upload ${args.patch}: it looks like it contains secrets. ` +
          'Drop --patch to create a fresh privacy page instead.',
      );
    }
    mode = 'patch';
    target = { path: args.patch, contents };
  }

  log.info(`Detected ${pc.bold(ctx.framework)} (mode: ${mode})`);

  // 3. Ask the server for a plan.
  spin.start('Building your install plan');
  let plan;
  try {
    plan = await postPlan(api, token, {
      framework: ctx.framework,
      mode,
      deps: ctx.deps,
      paths: ctx.paths,
      target,
    });
  } catch (err) {
    spin.stop('Could not build a plan');
    if (err instanceof WizardApiError && err.status === 503) {
      fail('SCADABLE could not generate a plan right now (model unavailable). Try again shortly.');
    }
    if (err instanceof WizardNetworkError) {
      fail(`Could not reach the SCADABLE API at ${api}. ${reason(err)}`);
    }
    fail(`Could not build a plan: ${reason(err)}`);
  }
  spin.stop('Plan ready');

  // 4. Show the plan.
  const pm = detectPackageManager(cwd);
  const packages = resolvePackages(plan.install);
  const installCmd = formatInstall(pm, packages);
  showPlan(installCmd, plan.edits, plan.deterministic);

  if (args.dryRun) {
    outro(pc.dim('Dry run complete. Nothing was written.'));
    return;
  }

  // 5. Confirm.
  if (!args.yes) {
    const ok = await confirm({ message: 'Apply this plan?' });
    if (isCancel(ok) || !ok) {
      cancel('No changes made.');
      process.exit(0);
    }
  }

  // 6. Install the dependency with the repo's package manager.
  spin.start(`Installing with ${pm}`);
  try {
    runInstall(cwd, pm, packages);
    spin.stop('Dependency installed');
  } catch (err) {
    spin.stop('Install failed');
    fail(`Could not run "${installCmd}": ${reason(err)}`);
  }

  // 7. Write/patch the files.
  for (const edit of plan.edits) {
    const abs = resolve(cwd, edit.path);
    if (edit.action === 'create' && existsSync(abs) && !args.yes) {
      const overwrite = await confirm({ message: `${edit.path} already exists. Overwrite it?` });
      if (isCancel(overwrite) || !overwrite) {
        log.warn(`Skipped ${edit.path}`);
        continue;
      }
    }
    writeEdit(cwd, edit);
    log.success(`${edit.action === 'patch' ? 'Patched' : 'Wrote'} ${edit.path}`);
  }

  // 8. Mark the scope connected. Local work is already done, so a failure here
  //    is a warning, not a hard error.
  spin.start('Finishing setup');
  try {
    await postComplete(api, token);
    spin.stop('Marked connected');
  } catch (err) {
    spin.stop('Setup written, but could not notify SCADABLE');
    log.warn(`The files are in place, but marking the connection failed: ${reason(err)}`);
  }

  outro(
    `${pc.green('Done.')} ${plan.route_hint}\n` +
      `  ${pc.dim('Public id:')} ${plan.public_id}`,
  );
}

main().catch((err) => {
  log.error(reason(err));
  process.exit(1);
});
