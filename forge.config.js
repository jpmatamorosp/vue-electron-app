const { MakerDMG } = require('@electron-forge/maker-dmg');
const { MakerZIP } = require('@electron-forge/maker-zip');
const { MakerSquirrel } = require('@electron-forge/maker-squirrel');
const { PublisherGithub } = require('@electron-forge/publisher-github');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const pkg = require('./package.json');

const winSetupIconPath = path.join(__dirname, 'public', 'favicon.ico');
const hasValidWinSetupIcon = (() => {
  try {
    return fs.statSync(winSetupIconPath).size > 0;
  } catch {
    return false;
  }
})();

const hasNotarizeCredentials =
  Boolean(process.env.APPLE_ID) &&
  Boolean(process.env.APPLE_APP_SPECIFIC_PASSWORD) &&
  Boolean(process.env.APPLE_TEAM_ID);

/**
 * Generates the electron-updater yaml manifest (latest-mac.yml / latest.yml)
 * from the built artifacts and injects it back into makeResults so the
 * GitHub publisher picks it up automatically.
 */
function generateUpdateYaml(artifacts, platform) {
  const ymlName = platform === 'darwin' ? 'latest-mac.yml' : 'latest.yml';

  const relevant = artifacts.filter((f) => {
    if (platform === 'darwin') return f.endsWith('.dmg');
    return f.endsWith('.exe') || f.endsWith('.nupkg');
  });

  if (relevant.length === 0) return null;

  const files = relevant.map((filePath) => {
    const content = fs.readFileSync(filePath);
    return {
      url: path.basename(filePath),
      sha512: crypto.createHash('sha512').update(content).digest('base64'),
      size: content.length,
    };
  });

  // Put x64 first on mac so electron-updater resolves the right arch-specific file
  files.sort((a) => (a.url.includes('arm64') ? 1 : -1));
  const primary = files[0];

  const lines = [
    `version: ${pkg.version}`,
    'files:',
    ...files.flatMap((f) => [
      `  - url: ${f.url}`,
      `    sha512: ${f.sha512}`,
      `    size: ${f.size}`,
    ]),
    `path: ${primary.url}`,
    `sha512: ${primary.sha512}`,
    `releaseDate: '${new Date().toISOString()}'`,
    '',
  ];

  const ymlDir = path.dirname(relevant[0]);
  const ymlPath = path.join(ymlDir, ymlName);
  fs.writeFileSync(ymlPath, lines.join('\n'));
  console.log(`forge: generated ${ymlName} at ${ymlPath}`);
  return ymlPath;
}

module.exports = {
  packagerConfig: {
    appBundleId: 'com.jpmatamorosp.vue-electron-app',
    name: 'Vue Electron App',
    extraResource: ['build/app-update.yml'],
    osxSign: {
      identity: process.env.APPLE_SIGN_IDENTITY || 'Developer ID Application',
      hardenedRuntime: true,
      entitlements: 'build/entitlements.mac.plist',
      'entitlements-inherit': 'build/entitlements.mac.plist',
    },
    osxNotarize: hasNotarizeCredentials
      ? {
          appleId: process.env.APPLE_ID,
          appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
          teamId: process.env.APPLE_TEAM_ID,
        }
      : undefined,
  },
  outDir: 'dist_electron',
  makers: [
    new MakerDMG({}, ['darwin']),
    new MakerZIP({}, ['darwin']),
    new MakerSquirrel(
      {
        name: 'vue_electron_app',
        setupExe: `Vue-Electron-App-Setup-${pkg.version}.exe`,
        ...(hasValidWinSetupIcon ? { setupIcon: winSetupIconPath } : {}),
      },
      ['win32']
    ),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: 'jpmatamorosp',
        name: 'vue-electron-app',
      },
      authToken: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
      prerelease: false,
      draft: false,
    }),
  ],
  hooks: {
    postMake: async (_forgeConfig, makeResults) => {
      for (const result of makeResults) {
        const ymlPath = generateUpdateYaml(result.artifacts, result.platform);
        if (ymlPath) {
          result.artifacts.push(ymlPath);
        }
      }
      return makeResults;
    },
  },
};
