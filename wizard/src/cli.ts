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
${pc.bgCyan(pc.black(' SCADABLE '))} ${pc.bold('privacy wizard')}
Add a live privacy page to your app in about 20 seconds. Commit, deploy, done.

${pc.bold('Usage')}
  npx @scadable/wizard@latest --token <TEMP_TOKEN> [options]

${pc.dim('Get your token from Settings in the SCADABLE app, then paste the whole command here.')}

${pc.bold('Options')}
  --token <token>   Install token from the SCADABLE app (required).
  --api <url>       API base. Default ${DEFAULT_API}.
  --dry-run         Preview the plan without writing anything.
  --yes, -y         Skip the prompts (non-interactive).
  --patch <file>    Add the policy to an existing page instead of creating one.
  --help, -h        Show this help.

${pc.dim('Your code stays private: only package.json and folder names are read.')}
`;

/**
 * SCADABLE wordmark, printed once at the top of a real run (never on --help).
 * Stored as line strings with backslashes escaped, so it survives the bundler
 * untouched. Rendered in brand teal (cyan reads as teal on most terminals).
 */
const BANNER = [
  '     _______.  ______     ___       _______       ___      .______    __       _______ ',
  '    /       | /      |   /   \\     |       \\     /   \\     |   _  \\  |  |     |   ____|',
  '   |   (----`|  ,----\'  /  ^  \\    |  .--.  |   /  ^  \\    |  |_)  | |  |     |  |__   ',
  '    \\   \\    |  |      /  /_\\  \\   |  |  |  |  /  /_\\  \\   |   _  <  |  |     |   __|  ',
  '.----)   |   |  `----./  _____  \\  |  \'--\'  | /  _____  \\  |  |_)  | |  `----.|  |____ ',
  '|_______/     \\______/__/     \\__\\ |_______/ /__/     \\__\\ |______/  |_______||_______|',
];

/** Print the teal wordmark, then a blank line, ahead of the intro. */
function printBanner(): void {
  for (const line of BANNER) console.log(pc.cyan(line));
  console.log('');
}

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

/** Render the plan as a single boxed note that is easy to scan. */
function showPlan(installCmd: string, edits: PlanEdit[], deterministic: boolean): void {
  const blocks: string[] = [`${pc.bold('Install')}\n  ${pc.cyan(installCmd)}`];
  for (const edit of edits) {
    const verb = edit.action === 'patch' ? 'Update' : 'Create';
    blocks.push(`${pc.bold(`${verb} ${edit.path}`)}\n${previewContents(edit.contents)}`);
  }
  const source = deterministic
    ? pc.dim('Built from a vetted template. Same result every time.')
    : pc.dim('Tailored to your project.');
  note(blocks.join('\n\n') + '\n\n' + source, "Here's the plan");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(HELP);
    return;
  }

  printBanner();
  intro(`${pc.bgCyan(pc.black(' SCADABLE '))} ${pc.bold('privacy wizard')}`);
  log.message(pc.dim('Setting up your privacy page. About 20 seconds.'));

  if (!args.token) {
    fail(
      'No install token yet. Open Settings in SCADABLE, then copy and paste the whole install command.',
    );
  }
  const token = args.token;
  const api = args.api.replace(/\/$/, '');
  const cwd = process.cwd();

  // 1. Verify the install token.
  const spin = spinner();
  spin.start('Checking your install token');
  let session;
  try {
    session = await getSession(api, token);
  } catch (err) {
    spin.stop('Token check failed', 2);
    if (err instanceof WizardApiError && err.status === 401) {
      fail(
        'That install token has expired. Reopen Settings in SCADABLE and copy a fresh install command, then run it again.',
      );
    }
    if (err instanceof WizardNetworkError) {
      fail(`Could not reach SCADABLE at ${api}. Check your connection and try again.`);
    }
    fail(`Could not verify your token: ${reason(err)}`);
  }
  spin.stop(`Connected to ${pc.bold(session.scope_name)} ${pc.dim(`(${session.domain})`)}`);

  // 2. Detect the framework and build minimal, privacy-respecting context.
  spin.start('Reading your project');
  let ctx;
  try {
    ctx = detectRepo(cwd);
  } catch (err) {
    spin.stop('Could not read your project', 2);
    fail(reason(err));
  }
  spin.stop(`Found ${pc.bold(ctx.framework)}`);
  log.message(pc.dim('Only package.json and folder names were read. Your code stays on your machine.'));
  if (ctx.warning) log.warn(ctx.warning);

  // Opt-in patch mode reads exactly one file, and refuses if it looks secret.
  let mode: 'create' | 'patch' = 'create';
  let target: PlanRequest['target'];
  if (args.patch) {
    const abs = resolve(cwd, args.patch);
    if (!existsSync(abs)) {
      fail(`Could not find the file to patch: ${args.patch}`);
    }
    const contents = readFileSync(abs, 'utf8');
    if (looksLikeSecret(contents)) {
      fail(
        `Not uploading ${args.patch}: it looks like it holds secrets. ` +
          'Drop --patch and the wizard will create a fresh privacy page instead.',
      );
    }
    mode = 'patch';
    target = { path: args.patch, contents };
  }

  // 3. Ask the server for a plan.
  spin.start('Building your plan');
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
    spin.stop('Could not build a plan', 2);
    if (err instanceof WizardApiError && err.status === 503) {
      fail('SCADABLE is busy and could not build your plan right now. Give it a moment and try again.');
    }
    if (err instanceof WizardNetworkError) {
      fail(`Could not reach SCADABLE at ${api}. Check your connection and try again.`);
    }
    fail(`Could not build a plan: ${reason(err)}`);
  }
  spin.stop('Plan ready');

  // 4. Show the plan.
  const pm = detectPackageManager(cwd);
  const packages = resolvePackages(plan.install);
  const installCmd = formatInstall(pm, packages);
  const liveUrl = `${api}/policy/${plan.public_id}`;
  showPlan(installCmd, plan.edits, plan.deterministic);

  if (args.dryRun) {
    log.message(`${pc.dim('Your page would live at')} ${pc.cyan(liveUrl)}`);
    outro(pc.dim('Dry run. Nothing was written. Run again without --dry-run to set it up.'));
    return;
  }

  // 5. Confirm. The plan is safe and reversible, so default to yes.
  if (!args.yes) {
    const ok = await confirm({
      message: 'Set up your privacy page?',
      active: 'Yes, do it',
      inactive: 'Not now',
      initialValue: true,
    });
    if (isCancel(ok) || !ok) {
      cancel('No problem. Nothing was changed. Run this again whenever you are ready.');
      process.exit(0);
    }
  }

  // 6. Install the dependency with the repo's package manager.
  spin.start('Installing @scadable/privacy');
  try {
    runInstall(cwd, pm, packages);
    spin.stop(`Installed @scadable/privacy ${pc.dim(`(${pm})`)}`);
  } catch (err) {
    spin.stop('Install failed', 2);
    fail(`Could not run "${installCmd}": ${reason(err)}`);
  }

  // 7. Write/patch the files. Decide each edit first (existing files may prompt),
  //    then write them together so the progress reads cleanly.
  const toWrite: PlanEdit[] = [];
  for (const edit of plan.edits) {
    const abs = resolve(cwd, edit.path);
    if (edit.action === 'create' && existsSync(abs) && !args.yes) {
      const overwrite = await confirm({
        message: `${edit.path} already exists. Replace it?`,
        active: 'Replace it',
        inactive: 'Keep mine',
        initialValue: false,
      });
      if (isCancel(overwrite) || !overwrite) {
        log.warn(`Kept your existing ${edit.path}`);
        continue;
      }
    }
    toWrite.push(edit);
  }

  spin.start('Writing your privacy page');
  for (const edit of toWrite) {
    writeEdit(cwd, edit);
  }
  spin.stop(toWrite.length ? 'Privacy page written' : 'Nothing new to write');

  // 8. Mark the scope connected. Local work is already done, so a failure here
  //    is a warning, not a hard error.
  spin.start('Finishing up');
  try {
    await postComplete(api, token);
    spin.stop('Connected to SCADABLE');
  } catch (err) {
    spin.stop('Files are in place, but could not reach SCADABLE to finish', 1);
    log.warn(`Your files are written. Marking the connection failed: ${reason(err)}`);
  }

  // 9. The payoff. Make the next step unmistakable.
  const payoff = [
    `${pc.bold('Next:')} commit and deploy. That's it.`,
    `  ${pc.cyan('git add -A && git commit -m "Add privacy policy"')}`,
    `  ${pc.dim('then push, or run your usual deploy')}`,
    ``,
    `${pc.bold('Where it lives')}`,
    `  ${pc.dim('Page  ')} ${pc.cyan(plan.route_hint)}`,
    `  ${pc.dim('Live  ')} ${pc.cyan(liveUrl)}`,
    ``,
    pc.dim('It stays current. Update your policy in SCADABLE and every page'),
    pc.dim('updates automatically. No redeploy.'),
    ``,
    pc.dim('Using a Content-Security-Policy? Add api.scadable.com to connect-src'),
    pc.dim('so the page can refresh live (it falls back to the saved copy if not).'),
  ].join('\n');
  note(payoff, pc.green('Your privacy page is ready'));
  outro(`${pc.green('Done.')} ${pc.dim('Commit and deploy, and you are live.')}`);
}

main().catch((err) => {
  log.error(reason(err));
  process.exit(1);
});
