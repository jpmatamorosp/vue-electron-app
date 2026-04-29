const { spawnSync } = require('child_process');

function runForgePublish(argv, token) {
  const forgeArgs = ['publish', ...argv];
  const forgeBin = require.resolve('@electron-forge/cli/dist/electron-forge.js');

  const result = spawnSync(process.execPath, [forgeBin, ...forgeArgs], {
    stdio: 'inherit',
    env: { ...process.env, GH_TOKEN: token, GITHUB_TOKEN: token },
  });

  if (result.error) throw result.error;
  return result.status ?? 0;
}

module.exports = {
  runForgePublish,
};
