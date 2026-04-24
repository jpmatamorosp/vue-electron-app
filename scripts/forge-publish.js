/**
 * Wrapper for `electron-forge publish` that loads .env before running.
 * This ensures local runs pick up GH_TOKEN and Apple credentials without
 * having to export them manually in the shell.
 *
 * Usage (via npm scripts):
 *   node scripts/forge-publish.js --platform=darwin
 *   node scripts/forge-publish.js --platform=win32
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// ---------- .env loader ----------
function loadDotEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;

  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const sep = line.indexOf('=');
    if (sep === -1) continue;

    const key = line.slice(0, sep).trim();
    if (!key || process.env[key]) continue; // don't overwrite existing env vars

    let value = line.slice(sep + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadDotEnv();

// ---------- validate token ----------
const ghToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!ghToken) {
  console.error('electron-forge publish requires a GitHub token.');
  console.error('Set GH_TOKEN or GITHUB_TOKEN in the shell or in .env');
  console.error('Example: GH_TOKEN=ghp_...');
  process.exit(1);
}

// ---------- run forge publish ----------
const forgeArgs = ['publish', ...process.argv.slice(2)];
const forgeBin = require.resolve('@electron-forge/cli/dist/electron-forge.js');

const result = spawnSync(process.execPath, [forgeBin, ...forgeArgs], {
  stdio: 'inherit',
  env: { ...process.env, GH_TOKEN: ghToken, GITHUB_TOKEN: ghToken },
});

if (result.error) throw result.error;
process.exit(result.status ?? 0);

