const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function loadDotEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key]) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();
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

const publishArgs = process.argv.slice(2);
const ghToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

function runOrExit(commandArgs, env) {
  const result = spawnSync(process.execPath, commandArgs, {
    stdio: 'inherit',
    env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!ghToken) {
  console.error('electron publish requires a GitHub token. Set GH_TOKEN or GITHUB_TOKEN in the shell or in .env.');
  console.error('Example .env entry: GH_TOKEN=<github-personal-access-token>');
  process.exit(1);
}

const vitePackagePath = require.resolve('vite/package.json');
const viteBinPath = path.join(path.dirname(vitePackagePath), 'bin', 'vite.js');
runOrExit([viteBinPath, 'build'], process.env);

const builderBin = require.resolve('electron-builder/cli.js');
runOrExit([builderBin, ...publishArgs, '--publish', 'always'], {
  ...process.env,
  GH_TOKEN: ghToken,
});