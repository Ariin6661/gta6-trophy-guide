// Hands in the Leonida Trophy Guide for gta6-trophy-guide-01 (Node 22, standard
// library only). The guide itself is plain static files: app/index.html plus its
// own CSS, ES modules and data, with no build step and nothing fetched over the
// network. This program copies app/ and screenshots/ from beside this file into
// the output directory and writes output/dossier.json with the vendored make.fun
// library, so the judge can read the screenshots and the source outline.
// vendor/makefun-frontend.ts is the kit's copy and must stay untouched.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyTree(join(repoRoot, "app"), join(outDir, "app"));
if (existsSync(join(repoRoot, "screenshots"))) {
  copyTree(join(repoRoot, "screenshots"), join(outDir, "screenshots"));
}

// The scorer's own caps, from the kit's reference/gate.json: the dossier text
// is capped at 160 KiB, at most 4 screenshots of 256 KiB each, and app/ holds
// at most 993 files and directories totalling 48 MiB.
const dossierText = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, "dossier.json"), dossierText);
