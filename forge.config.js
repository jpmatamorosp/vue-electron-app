const { MakerDMG } = require('@electron-forge/maker-dmg');
const { MakerZIP } = require('@electron-forge/maker-zip');
const { MakerSquirrel } = require('@electron-forge/maker-squirrel');
const { PublisherGithub } = require('@electron-forge/publisher-github');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

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

const shouldSignMac = process.env.MAC_SIGN !== 'false';
const macSignIdentity = process.env.APPLE_SIGN_IDENTITY || '-';
const isAdHocMacSign = macSignIdentity === '-';

function collectAppBundles(packageResult) {
  const outputPaths = [];
  if (Array.isArray(packageResult?.outputPaths)) {
    outputPaths.push(...packageResult.outputPaths);
  } else if (typeof packageResult?.outputPath === 'string') {
    outputPaths.push(packageResult.outputPath);
  }

  const bundles = [];
  for (const outputPath of outputPaths) {
    if (!outputPath || !fs.existsSync(outputPath)) continue;
    if (outputPath.endsWith('.app')) {
      bundles.push(outputPath);
      continue;
    }
    if (!fs.statSync(outputPath).isDirectory()) continue;
    for (const entry of fs.readdirSync(outputPath)) {
      if (entry.endsWith('.app')) {
        bundles.push(path.join(outputPath, entry));
      }
    }
  }
  return bundles;
}

function adHocSignAppBundle(appPath) {
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', '--timestamp=none', appPath], {
    stdio: 'inherit',
  });
  execFileSync('codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath], {
    stdio: 'inherit',
  });
}

function normalizeArtifactName(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const ext = path.extname(base);
  const stem = base.slice(0, base.length - ext.length);

  // Keep version/arch segments intact; only normalize the app-name prefix.
  const normalizedStem = stem
    .replace(/^Vue[ ._-]+Electron[ ._-]+App/, 'Vue-Electron-App')
    .replace(/\s+/g, '-');

  const normalizedBase = `${normalizedStem}${ext}`;
  if (normalizedBase === base) return filePath;

  const nextPath = path.join(dir, normalizedBase);
  fs.renameSync(filePath, nextPath);
  return nextPath;
}

/**
 * Generates the electron-updater yaml manifest (latest-mac.yml / latest.yml)
 * from the built artifacts and injects it back into makeResults so the
 * GitHub publisher picks it up automatically.
 */
function generateUpdateYaml(artifacts, platform) {
  const ymlName = platform === 'darwin' ? 'latest-mac.yml' : 'latest.yml';

  const relevant = artifacts.filter((f) => {
    if (platform === 'darwin') return f.endsWith('.zip') || f.endsWith('.dmg');
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

  // electron-updater on macOS expects a ZIP payload for install.
  const zipFiles = files.filter((f) => f.url.endsWith('.zip'));
  const dmgFiles = files.filter((f) => f.url.endsWith('.dmg'));
  const orderedFiles = platform === 'darwin' ? [...zipFiles, ...dmgFiles] : files;
  const primary = orderedFiles[0];

  const lines = [
    `version: ${pkg.version}`,
    'files:',
    ...orderedFiles.flatMap((f) => [
      `  - url: ${f.url}`,
      `    sha512: ${f.sha512}`,
      `    size: ${f.size}`,
    ]),
    `path: ${primary.url}`,
    `sha512: ${primary.sha512}`,
    `releaseDate: '${new Date().toISOString()}'`,
    '',
  ];

  const dmgArtifact = relevant.find((f) => f.endsWith('.dmg'));
  const ymlDir = path.dirname(dmgArtifact || relevant[0]);
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
    osxSign: shouldSignMac
      ? {
          identity: macSignIdentity,
          ...(isAdHocMacSign
            ? {
                // For local dev, skip packager signing and run a full explicit ad-hoc pass in postPackage.
                gatekeeperAssess: false,
              }
            : {
                hardenedRuntime: true,
                entitlements: 'build/entitlements.mac.plist',
                'entitlements-inherit': 'build/entitlements.mac.plist',
              }),
        }
      : undefined,
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
    postPackage: async (_forgeConfig, packageResult) => {
      if (!isAdHocMacSign) return;
      if (packageResult.platform !== 'darwin') return;

      const appBundles = collectAppBundles(packageResult);
      for (const appPath of appBundles) {
        console.log(`forge: ad-hoc signing ${appPath}`);
        adHocSignAppBundle(appPath);
      }
    },
    postMake: async (_forgeConfig, makeResults) => {
      for (const result of makeResults) {
        result.artifacts = result.artifacts.map(normalizeArtifactName);
      }

      const byPlatform = new Map();
      for (const result of makeResults) {
        if (!byPlatform.has(result.platform)) {
          byPlatform.set(result.platform, []);
        }
        byPlatform.get(result.platform).push(result);
      }

      for (const [platform, results] of byPlatform.entries()) {
        const artifacts = results.flatMap((r) => r.artifacts);
        const ymlPath = generateUpdateYaml(artifacts, platform);
        if (ymlPath) {
          // Attach the manifest once; publisher will include it as a release asset.
          results[0].artifacts.push(ymlPath);
        }
      }
      return makeResults;
    },
  },
};
