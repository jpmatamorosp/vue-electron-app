const SUPPORTED_PLATFORMS = new Set(['win32', 'darwin']);

const PLATFORM_ASSET_MATCHERS = {
  win32: [
    (name) => name.endsWith('.exe'),
    (name) => name.endsWith('.nupkg'),
    (name) => name === 'releases',
    (name) => name === 'latest.yml',
    (name) => name.endsWith('.blockmap'),
  ],
  darwin: [
    (name) => name.endsWith('.dmg'),
    (name) => name.endsWith('.zip'),
    (name) => name === 'latest-mac.yml',
    (name) => name.endsWith('.zip.blockmap'),
  ],
};

module.exports = {
  SUPPORTED_PLATFORMS,
  PLATFORM_ASSET_MATCHERS,
};
