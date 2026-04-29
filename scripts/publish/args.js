const { SUPPORTED_PLATFORMS } = require('./constants');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function getPublishPlatform(argv) {
  const platformArg = argv.find((arg) => arg.startsWith('--platform='));
  if (!platformArg) return null;
  return platformArg.split('=')[1];
}

function validatePlatform(platform) {
  if (!platform || !SUPPORTED_PLATFORMS.has(platform)) {
    fail('Missing or unsupported --platform argument. Use --platform=win32 or --platform=darwin');
  }
}

module.exports = {
  fail,
  getPublishPlatform,
  validatePlatform,
};
