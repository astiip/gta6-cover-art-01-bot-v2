// Palm Light — a gta6-cover-art-01 entry (Node 22, standard library only).
//
// What this program does: it takes the app/ folder next to this file (the
// cover maker: plain static files a desktop browser opens offline) and the
// screenshots/ folder, copies both into the output directory, and writes
// /output/dossier.json with buildDossier from the vendored make.fun
// library — the summary the judge reads. Nothing else is written.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for
// /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Try the app first with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The same caps the scorer reads from the competition's gate: only
// text_max_bytes shapes the dossier's bytes, the rest make this program
// fail exactly where the scorer would refuse the entry (too many or too
// big screenshots, app/ past 993 entries or 48 MiB, a path over 1000
// bytes — app/ shares /output's own 1000-entry cap with screenshots/ and
// dossier.json).
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
