const { fail } = require('./args');

function parseRepoSlug(repositoryValue) {
  if (!repositoryValue) return null;

  if (typeof repositoryValue === 'string') {
    const githubShort = repositoryValue.match(/^github:([^/]+)\/([^/]+)$/i);
    if (githubShort) {
      return { owner: githubShort[1], name: githubShort[2] };
    }

    const githubUrl = repositoryValue.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?$/i);
    if (githubUrl) {
      return { owner: githubUrl[1], name: githubUrl[2] };
    }
  }

  if (repositoryValue && typeof repositoryValue === 'object') {
    if (repositoryValue.owner && repositoryValue.name) {
      return { owner: repositoryValue.owner, name: repositoryValue.name };
    }

    if (typeof repositoryValue.url === 'string') {
      return parseRepoSlug(repositoryValue.url);
    }
  }

  return null;
}

function getProjectConfig() {
  const pkg = require('../../package.json');
  const repo = parseRepoSlug(pkg.repository);

  if (!repo) {
    fail('Could not parse repository owner/name from package.json repository field.');
  }

  return {
    version: pkg.version,
    owner: repo.owner,
    repo: repo.name,
  };
}

module.exports = {
  getProjectConfig,
};
