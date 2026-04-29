const { loadDotEnv, getGitHubToken } = require('./env');
const { fail, getPublishPlatform, validatePlatform } = require('./args');
const { getProjectConfig } = require('./project-config');
const { createGitHubClient } = require('./github-client');
const { ReleaseAssetCleaner } = require('./asset-cleaner');
const { runForgePublish } = require('./run-forge');

async function main() {
  loadDotEnv();

  const token = getGitHubToken();
  if (!token) {
    console.error('electron-forge publish requires a GitHub token.');
    console.error('Set GH_TOKEN or GITHUB_TOKEN in the shell or in .env');
    console.error('Example: GH_TOKEN=ghp_...');
    process.exit(1);
  }

  const argv = process.argv.slice(2);
  const platform = getPublishPlatform(argv);
  validatePlatform(platform);

  const projectConfig = getProjectConfig();
  const cleaner = new ReleaseAssetCleaner(createGitHubClient(token));

  await cleaner.deleteExistingPlatformAssets({
    owner: projectConfig.owner,
    repo: projectConfig.repo,
    version: projectConfig.version,
    platform,
  });

  const status = runForgePublish(argv, token);
  process.exit(status);
}

module.exports = {
  main,
};
