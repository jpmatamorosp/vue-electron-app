const https = require('https');

function createGitHubClient(token) {
  function requestJson(method, apiPath) {
    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'api.github.com',
          path: apiPath,
          method,
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `token ${token}`,
            'User-Agent': 'vue-electron-app-forge-publish',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        },
        (res) => {
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8');
            const status = res.statusCode || 0;

            if (status >= 200 && status < 300) {
              if (!raw) {
                resolve(null);
                return;
              }

              try {
                resolve(JSON.parse(raw));
              } catch {
                resolve(null);
              }
              return;
            }

            const error = new Error(`GitHub API ${method} ${apiPath} failed (${status}): ${raw || 'no body'}`);
            error.statusCode = status;
            reject(error);
          });
        }
      );

      req.on('error', reject);
      req.end();
    });
  }

  return {
    getReleaseByTag(owner, repo, tag) {
      const apiPath = `/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`;
      return requestJson('GET', apiPath);
    },
    deleteReleaseAsset(owner, repo, assetId) {
      const apiPath = `/repos/${owner}/${repo}/releases/assets/${assetId}`;
      return requestJson('DELETE', apiPath);
    },
  };
}

module.exports = {
  createGitHubClient,
};
