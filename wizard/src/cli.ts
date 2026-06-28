/**
 * `@scadable/wizard` - a one-time setup wizard that wires your always-current
 * SCADABLE legal documents (privacy policy, terms of use, and more) into your
 * codebase, live from the SCADABLE API.
 *
 *   npx @scadable/wizard@latest --token <TEMP_TOKEN>
 *
 * Zero-friction: one command, one token, done. It verifies your install token,
 * detects your web framework, scaffolds the right `@scadable/*` plugin (or the
 * universal CDN embed for a static site) for the document type(s) you pick,
 * installs the package, writes your page(s), and marks the scope connected. It
 * only ever talks to the public SCADABLE API and collects the minimum context
 * (framework + dependency names + a shallow path listing).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  note,
  outro,
  select,
  spinner,
} from '@clack/prompts';
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
import { buildScaffold, type DocType, type ScaffoldPlan } from './scaffold';

interface CliArgs {
  token?: string;
  api: string;
  docType?: string;
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
    else if (a === '--doc-type') args.docType = argv[++i];
    else if (a === '--patch') args.patch = argv[++i];
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--yes' || a === '-y') args.yes = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (a.startsWith('--token=')) args.token = a.slice('--token='.length);
    else if (a.startsWith('--api=')) args.api = a.slice('--api='.length);
    else if (a.startsWith('--doc-type=')) args.docType = a.slice('--doc-type='.length);
    else if (a.startsWith('--patch=')) args.patch = a.slice('--patch='.length);
    else console.error(pc.yellow(`Ignoring unknown option: ${a}`));
  }
  return args;
}

const HELP = `
${pc.bgCyan(pc.black(' SCADABLE '))} ${pc.bold('setup wizard')}
Add your always-current legal documents (privacy policy, terms of use) to any app
in about 20 seconds. One command, one token, done. Commit, deploy, live.

${pc.bold('Usage')}
  npx @scadable/wizard@latest --token <TEMP_TOKEN> [options]

${pc.dim('Get your token from Settings in the SCADABLE app, then paste the whole command here.')}

${pc.bold('Options')}
  --token <token>       Install token from the SCADABLE app (required).
  --doc-type <type>     privacy | terms | both. Default: ask (privacy if non-interactive).
  --api <url>           API base. Default ${DEFAULT_API}.
  --dry-run             Preview the plan without writing anything.
  --yes, -y             Skip the prompts (non-interactive).
  --patch <file>        Add the privacy policy to an existing page instead of creating one.
  --help, -h            Show this help.

${pc.bold('Frameworks')}
  ${pc.dim('Next.js, Astro, Vue/Nuxt, Svelte/SvelteKit, React (Vite, CRA, Remix, Gatsby),')}
  ${pc.dim('and plain HTML (universal CDN embed). The wizard detects yours automatically.')}

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

/** Human label for a document type. */
function docLabel(docType: DocType): string {
  return docType === 'privacy_policy' ? 'Privacy Policy' : 'Terms of Use';
}

/** The public URL the document renders at on the SCADABLE API. */
function liveUrl(api: string, publicId: string, docType: DocType): string {
  return docType === 'privacy_policy'
    ? `${api}/policy/${publicId}`
    : `${api}/policy/${publicId}?doc_type=${docType}`;
}

/** Map the `--doc-type` flag to document types, or undefined if absent/invalid. */
function docTypesFromFlag(value: string | undefined): DocType[] | undefined {
  if (!value) return undefined;
  switch (value.trim().toLowerCase()) {
    case 'privacy':
    case 'privacy_policy':
      return ['privacy_policy'];
    case 'terms':
    case 'terms_of_use':
      return ['terms_of_use'];
    case 'both':
    case 'all':
      return ['privacy_policy', 'terms_of_use'];
    default:
      return undefined;
  }
}

/** Ask which documents to add. Honors the flag; falls back to a prompt or default. */
async function chooseDocTypes(args: CliArgs): Promise<DocType[]> {
  const fromFlag = docTypesFromFlag(args.docType);
  if (fromFlag) return fromFlag;
  if (args.docType) {
    log.warn(`Unknown --doc-type "${args.docType}". Expected privacy, terms, or both.`);
  }
  // Non-interactive: default to the privacy policy, the most common single page.
  if (args.yes || args.dryRun) return ['privacy_policy'];

  const choice = await select({
    message: 'Which documents do you want to add?',
    options: [
      { value: 'privacy', label: 'Privacy Policy', hint: '/privacy' },
      { value: 'terms', label: 'Terms of Use', hint: '/terms' },
      { value: 'both', label: 'Both', hint: '/privacy and /terms' },
    ],
    initialValue: 'privacy',
  });
  if (isCancel(choice)) {
    cancel('No problem. Nothing was changed. Run this again whenever you are ready.');
    process.exit(0);
  }
  return docTypesFromFlag(String(choice)) ?? ['privacy_policy'];
}

/** Render a create-path scaffold plan as one boxed note that is easy to scan. */
function showScaffoldPlan(plan: ScaffoldPlan, installCmd: string | null): void {
  const blocks: string[] = [];
  blocks.push(
    installCmd
      ? `${pc.bold('Install')}\n  ${pc.cyan(installCmd)}`
      : `${pc.bold('Install')}\n  ${pc.dim('Nothing to install. The embed loads from the CDN.')}`,
  );
  for (const file of plan.files) {
    blocks.push(`${pc.bold(`Create ${file.path}`)}\n${previewContents(file.contents)}`);
  }
  blocks.push(pc.dim('Built from a vetted template. Same result every time.'));
  note(blocks.join('\n\n'), "Here's the plan");
}

/** Render a server-built patch plan (the legacy --patch path). */
function showPlanEdits(installCmd: string, edits: PlanEdit[], deterministic: boolean): void {
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

/**
 * Decide which edits to actually write, prompting before replacing existing
 * files (unless --yes). Returns the edits that should be written.
 */
async function pickWritableEdits(cwd: string, edits: PlanEdit[], yes: boolean): Promise<PlanEdit[]> {
  const toWrite: PlanEdit[] = [];
  for (const edit of edits) {
    const abs = resolve(cwd, edit.path);
    if (edit.action === 'create' && existsSync(abs) && !yes) {
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
  return toWrite;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(HELP);
    return;
  }

  printBanner();
  intro(`${pc.bgCyan(pc.black(' SCADABLE '))} ${pc.bold('setup wizard')}`);
  log.message(pc.dim('Wiring your legal pages in, live from SCADABLE. About 20 seconds.'));

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

  // The legacy --patch path is server-driven (LLM) and remains for inserting the
  // privacy policy into an existing page. The default create path is client-side.
  if (args.patch) {
    await runPatch(args, api, token, ctx.framework, ctx.deps, ctx.paths, cwd, spin);
    return;
  }

  // 3. Pick the document type(s) and build the scaffold from the client registry.
  const docTypes = await chooseDocTypes(args);
  const plan = buildScaffold(ctx.framework, docTypes, session.public_id);

  // 4. Show the plan.
  const pm = detectPackageManager(cwd);
  const packages = plan.install ? [plan.install] : [];
  const installCmd = packages.length ? formatInstall(pm, packages) : null;
  showScaffoldPlan(plan, installCmd);

  if (args.dryRun) {
    for (const r of plan.routes) {
      log.message(
        `${pc.dim(`${docLabel(r.docType)} would live at`)} ${pc.cyan(liveUrl(api, session.public_id, r.docType))}`,
      );
    }
    outro(pc.dim('Dry run. Nothing was written. Run again without --dry-run to set it up.'));
    return;
  }

  // 5. Confirm. The plan is safe and reversible, so default to yes.
  if (!args.yes) {
    const ok = await confirm({
      message: 'Set up your pages?',
      active: 'Yes, do it',
      inactive: 'Not now',
      initialValue: true,
    });
    if (isCancel(ok) || !ok) {
      cancel('No problem. Nothing was changed. Run this again whenever you are ready.');
      process.exit(0);
    }
  }

  // 6. Install the plugin with the repo's package manager (skip for the CDN embed).
  if (packages.length) {
    spin.start(`Installing ${plan.install}`);
    try {
      runInstall(cwd, pm, packages);
      spin.stop(`Installed ${plan.install} ${pc.dim(`(${pm})`)}`);
    } catch (err) {
      spin.stop('Install failed', 2);
      fail(`Could not run "${installCmd}": ${reason(err)}`);
    }
  }

  // 7. Write the files (prompting before replacing existing ones).
  const edits: PlanEdit[] = plan.files.map((f) => ({ path: f.path, action: 'create', contents: f.contents }));
  const toWrite = await pickWritableEdits(cwd, edits, args.yes);
  spin.start('Writing your pages');
  for (const edit of toWrite) writeEdit(cwd, edit);
  spin.stop(toWrite.length ? 'Pages written' : 'Nothing new to write');

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
  const where: string[] = [`${pc.bold('Where they live')}`];
  for (const r of plan.routes) {
    where.push(`  ${pc.dim(docLabel(r.docType).padEnd(15))} ${pc.cyan(r.hint)}`);
    where.push(`  ${pc.dim('Live'.padEnd(15))} ${pc.cyan(liveUrl(api, session.public_id, r.docType))}`);
  }

  const payoff = [
    `${pc.bold('Next:')} commit and deploy. That's it.`,
    `  ${pc.cyan('git add -A && git commit -m "Add legal pages"')}`,
    `  ${pc.dim('then push, or run your usual deploy')}`,
    ``,
    ...where,
    ``,
    pc.dim('They stay current. Update a document in SCADABLE and every page'),
    pc.dim('updates automatically. No redeploy.'),
  ];

  // For the static-site embed, hand over the paste-anywhere snippet too.
  if (plan.snippets.length) {
    payoff.push(
      ``,
      pc.dim('Prefer to drop it into an existing page? Paste this where you want it:'),
      ...plan.snippets.flatMap((s) => s.split('\n').map((l) => `  ${pc.cyan(l)}`)),
    );
  }

  payoff.push(
    ``,
    pc.dim('Using a Content-Security-Policy? Add api.scadable.com to connect-src'),
    pc.dim('so the page can refresh live (it falls back to the saved copy if not).'),
  );

  note(payoff.join('\n'), pc.green('Your pages are ready'));
  outro(`${pc.green('Done.')} ${pc.dim('Commit and deploy, and you are live.')}`);
}

/**
 * The legacy server-driven patch path: insert the privacy policy into one
 * existing file. Reads exactly that file, refuses secret-shaped input, and asks
 * the SCADABLE API for the edit (the only path that uses a model).
 */
async function runPatch(
  args: CliArgs,
  api: string,
  token: string,
  framework: string,
  deps: string[],
  paths: string[],
  cwd: string,
  spin: ReturnType<typeof spinner>,
): Promise<void> {
  const patchPath = args.patch as string;
  const abs = resolve(cwd, patchPath);
  if (!existsSync(abs)) {
    fail(`Could not find the file to patch: ${patchPath}`);
  }
  const contents = readFileSync(abs, 'utf8');
  if (looksLikeSecret(contents)) {
    fail(
      `Not uploading ${patchPath}: it looks like it holds secrets. ` +
        'Drop --patch and the wizard will create a fresh page instead.',
    );
  }
  const target: PlanRequest['target'] = { path: patchPath, contents };

  spin.start('Building your plan');
  let plan;
  try {
    plan = await postPlan(api, token, { framework, mode: 'patch', deps, paths, target });
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

  const pm = detectPackageManager(cwd);
  const packages = resolvePackages(plan.install);
  const installCmd = formatInstall(pm, packages);
  const liveLink = `${api}/policy/${plan.public_id}`;
  showPlanEdits(installCmd, plan.edits, plan.deterministic);

  if (args.dryRun) {
    log.message(`${pc.dim('Your page would live at')} ${pc.cyan(liveLink)}`);
    outro(pc.dim('Dry run. Nothing was written. Run again without --dry-run to set it up.'));
    return;
  }

  if (!args.yes) {
    const ok = await confirm({
      message: 'Add the privacy policy to this page?',
      active: 'Yes, do it',
      inactive: 'Not now',
      initialValue: true,
    });
    if (isCancel(ok) || !ok) {
      cancel('No problem. Nothing was changed. Run this again whenever you are ready.');
      process.exit(0);
    }
  }

  if (packages.length) {
    spin.start(`Installing ${packages.join(' ')}`);
    try {
      runInstall(cwd, pm, packages);
      spin.stop(`Installed ${packages.join(' ')} ${pc.dim(`(${pm})`)}`);
    } catch (err) {
      spin.stop('Install failed', 2);
      fail(`Could not run "${installCmd}": ${reason(err)}`);
    }
  }

  const toWrite = await pickWritableEdits(cwd, plan.edits, args.yes);
  spin.start('Writing your page');
  for (const edit of toWrite) writeEdit(cwd, edit);
  spin.stop(toWrite.length ? 'Page written' : 'Nothing new to write');

  spin.start('Finishing up');
  try {
    await postComplete(api, token);
    spin.stop('Connected to SCADABLE');
  } catch (err) {
    spin.stop('Files are in place, but could not reach SCADABLE to finish', 1);
    log.warn(`Your files are written. Marking the connection failed: ${reason(err)}`);
  }

  const payoff = [
    `${pc.bold('Next:')} commit and deploy. That's it.`,
    `  ${pc.cyan('git add -A && git commit -m "Add privacy policy"')}`,
    `  ${pc.dim('then push, or run your usual deploy')}`,
    ``,
    `${pc.bold('Where it lives')}`,
    `  ${pc.dim('Page  ')} ${pc.cyan(plan.route_hint)}`,
    `  ${pc.dim('Live  ')} ${pc.cyan(liveLink)}`,
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
