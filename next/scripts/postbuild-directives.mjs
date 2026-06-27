// esbuild strips module-level "use client" directives when it bundles, and leaves
// the cross-file import to the client island extensionless. This restores both so
// Next.js sees PolicyLive as a real client component and ESM/CJS resolve the import.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');

function prepend(file, text) {
  const p = join(dist, file);
  if (!existsSync(p)) return;
  const src = readFileSync(p, 'utf8');
  if (src.startsWith(text)) return;
  writeFileSync(p, text + src);
}

function rewrite(file, from, to) {
  const p = join(dist, file);
  if (!existsSync(p)) return;
  writeFileSync(p, readFileSync(p, 'utf8').split(from).join(to));
}

// 1) Restore the "use client" directive on the client island.
prepend('PolicyLive.js', '"use client";\n');
prepend('PolicyLive.cjs', '"use client";\n');

// 2) Give the server entry's import of the island a real extension.
rewrite('index.js', "from './PolicyLive'", "from './PolicyLive.js'");
rewrite('index.cjs', "require('./PolicyLive')", "require('./PolicyLive.cjs')");

console.log('postbuild: restored "use client" + fixed PolicyLive import extensions');
