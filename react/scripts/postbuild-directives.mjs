// esbuild strips module-level "use client" directives when it bundles. This is a
// pure client package (the whole module is a client module, with no server/client
// split), so we just restore the directive at the top of the built entry files so
// React frameworks treat the exported components as client components.
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

prepend('index.js', '"use client";\n');
prepend('index.cjs', '"use client";\n');

console.log('postbuild: restored "use client" on dist/index.js and dist/index.cjs');
