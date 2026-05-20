#!/usr/bin/env node
/**
 * Full release workflow: sync semver everywhere, promote CHANGELOG Unreleased,
 * refresh docs examples, verify build, optional git commit + tag.
 *
 * Usage:
 *   node scripts/release-bump.mjs 0.2.0
 *   npm run release:bump -- 0.2.0
 *   npm run release:bump -- --no-git --date 2026-05-08 0.2.0
 *
 * Flags:
 *   --no-verify   Skip npm run build, lint, cargo build
 *   --no-changelog Do not move Unreleased → version section
 *   --no-docs     Skip README + plan_handoff version replaces
 *   --no-git      Skip git commit and annotated tag
 *   --tauri       After verify, run npm run tauri build (DMG / bundle)
 *   --date YYYY-MM-DD  Release date in CHANGELOG & plan_handoff (default: today)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function parseArgs(argv) {
  const flags = {
    noVerify: false,
    noChangelog: false,
    noDocs: false,
    noGit: false,
    tauri: false,
    date: new Date().toISOString().slice(0, 10),
  };
  const pos = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--no-verify") flags.noVerify = true;
    else if (a === "--no-changelog") flags.noChangelog = true;
    else if (a === "--no-docs") flags.noDocs = true;
    else if (a === "--no-git") flags.noGit = true;
    else if (a === "--tauri") flags.tauri = true;
    else if (a === "--date") {
      flags.date = argv[++i];
      if (!flags.date) {
        console.error("Missing value for --date");
        process.exit(1);
      }
    } else if (a.startsWith("-")) {
      console.error(`Unknown flag: ${a}`);
      process.exit(1);
    } else pos.push(a);
  }
  return { flags, version: pos[0] };
}

function readJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

function writeJson(p, obj) {
  writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");
}

/** Promote ## Unreleased body to ## version - date; reset Unreleased. */
function promoteChangelog(changelogPath, newVer, releaseDate) {
  const lines = readFileSync(changelogPath, "utf8").split("\n");
  const i = lines.findIndex((l) => l === "## Unreleased");
  if (i === -1) {
    throw new Error("CHANGELOG.md: missing ## Unreleased section");
  }
  let j = i + 1;
  while (j < lines.length && !/^## /.test(lines[j])) j++;
  if (j < lines.length) {
    const next = lines[j];
    if (new RegExp(`^## ${escapeRe(newVer)}\\s+-`).test(next)) {
      throw new Error(`CHANGELOG.md: section ${newVer} already exists (${next})`);
    }
  }
  const unreleasedBody = lines.slice(i + 1, j).join("\n").trimEnd();
  const head = lines.slice(0, i).join("\n");
  const tail = lines.slice(j).join("\n");
  const versionBlock =
    `## ${newVer} - ${releaseDate}\n\n` + (unreleasedBody ? unreleasedBody + "\n\n" : "");
  const out = `${head}\n## Unreleased\n\n${versionBlock}${tail}`;
  writeFileSync(changelogPath, out);
  console.log(`CHANGELOG.md: promoted Unreleased → ${newVer} (${releaseDate})`);
}

function replaceVersionInFile(filePath, oldVer, newVer) {
  let s = readFileSync(filePath, "utf8");
  const before = s;
  s = s.split(oldVer).join(newVer);
  if (s !== before) {
    writeFileSync(filePath, s);
    console.log(`Updated version refs ${oldVer} → ${newVer} in ${filePath}`);
  }
}

/** plan_handoff: section 4 title + all oldVer → newVer (incl. DMG name). */
function updatePlanHandoff(planPath, oldVer, newVer, releaseDate) {
  let s = readFileSync(planPath, "utf8");
  s = s.replace(
    new RegExp(`^## 4\\. Release v${escapeRe(oldVer)}（[^）]*）`, "m"),
    `## 4. Release v${newVer}（${releaseDate}）`
  );
  s = s.split(oldVer).join(newVer);
  writeFileSync(planPath, s);
  console.log(`docs/plan_handoff_next_version.md: synced for v${newVer}`);
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function bumpPackageVersions(newVer) {
  const pkgPath = join(ROOT, "package.json");
  const pkg = readJson(pkgPath);
  const old = pkg.version;
  if (old === newVer) {
    console.error(`Already at version ${newVer}. Bump to a new semver or edit package.json.`);
    process.exit(1);
  }
  pkg.version = newVer;
  writeJson(pkgPath, pkg);

  const tauriConf = readJson(join(ROOT, "src-tauri", "tauri.conf.json"));
  tauriConf.version = newVer;
  writeJson(join(ROOT, "src-tauri", "tauri.conf.json"), tauriConf);

  let cargo = readFileSync(join(ROOT, "src-tauri", "Cargo.toml"), "utf8");
  const cargoRe = /^version = "[^"]+"/m;
  if (!cargoRe.test(cargo)) {
    throw new Error("Could not find [package] version in src-tauri/Cargo.toml");
  }
  cargo = cargo.replace(cargoRe, `version = "${newVer}"`);
  writeFileSync(join(ROOT, "src-tauri", "Cargo.toml"), cargo);

  console.log(`Bumped ${old} → ${newVer}`);
  return old;
}

function sh(cmd, opts = {}) {
  execSync(cmd, { stdio: "inherit", cwd: ROOT, ...opts });
}

function main() {
  const { flags, version: newVer } = parseArgs(process.argv.slice(2));
  if (!newVer) {
    console.error(`Usage: node scripts/release-bump.mjs [flags] <semver>
Flags: --no-verify --no-changelog --no-docs --no-git --tauri --date YYYY-MM-DD`);
    process.exit(1);
  }
  if (!/^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/.test(newVer)) {
    console.error("Invalid semver:", newVer);
    process.exit(1);
  }

  const pkgPath = join(ROOT, "package.json");
  const previous = readJson(pkgPath).version;
  if (previous === newVer) {
    console.error(`package.json is already ${newVer}. Nothing to bump.`);
    process.exit(1);
  }

  const oldVer = bumpPackageVersions(newVer);

  if (!flags.noChangelog) {
    promoteChangelog(join(ROOT, "CHANGELOG.md"), newVer, flags.date);
  }

  if (!flags.noDocs) {
    replaceVersionInFile(join(ROOT, "README.md"), oldVer, newVer);
    updatePlanHandoff(
      join(ROOT, "docs", "plan_handoff_next_version.md"),
      oldVer,
      newVer,
      flags.date
    );
  }

  console.log("Running npm install (sync package-lock.json)...");
  sh("npm install --no-fund --no-audit");

  console.log("Running cargo check (sync Cargo.lock)...");
  sh("cargo check -q", { cwd: join(ROOT, "src-tauri") });

  if (!flags.noVerify) {
    console.log("npm run build...");
    sh("npm run build");
    console.log("npm run lint...");
    sh("npm run lint");
    console.log("cargo build --locked...");
    sh("cargo build --locked -q", { cwd: join(ROOT, "src-tauri") });
  }

  if (flags.tauri) {
    console.log("npm run tauri build (bundle)...");
    sh("npm run tauri build");
  }

  if (!flags.noGit) {
    let inGit = true;
    try {
      execSync("git rev-parse --git-dir", { stdio: "pipe", cwd: ROOT });
    } catch {
      inGit = false;
      console.warn("Not a git repository; skipping commit/tag.");
    }
    if (inGit) {
      const tag = `v${newVer}`;
      const porcelain = execSync("git status --porcelain", {
        encoding: "utf8",
        cwd: ROOT,
      }).trim();
      if (!porcelain) {
        console.warn("Working tree clean; nothing to commit.");
      } else {
        execFileSync("git", ["add", "-A"], { stdio: "inherit", cwd: ROOT });
        execFileSync(
          "git",
          ["commit", "-m", `chore: release ${tag}`],
          { stdio: "inherit", cwd: ROOT }
        );
      }
      const existing = execFileSync("git", ["tag", "-l", tag], {
        encoding: "utf8",
        cwd: ROOT,
      }).trim();
      if (existing === tag) {
        console.warn(`Tag ${tag} already exists; skip tagging.`);
      } else {
        execFileSync(
          "git",
          ["tag", "-a", tag, "-m", `TikZ Drawer ${tag}`],
          { stdio: "inherit", cwd: ROOT }
        );
      }
      console.log(`Git: commit (if needed) and tag ${tag} done.`);
    }
  }

  console.log(`
Done — ${newVer}
  • Push:  git push origin HEAD && git push origin v${newVer}
  • gh:    gh release create v${newVer} --title "TikZ Drawer v${newVer}" --notes "See CHANGELOG.md § ${newVer}." ./src-tauri/target/release/bundle/dmg/*.dmg
  • Or draft the release on GitHub and upload the DMG from bundle/dmg/
`);
}

main();
