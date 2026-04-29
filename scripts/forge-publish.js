/**
 * Wrapper for `electron-forge publish` that loads .env before running.
 * This ensures local runs pick up GH_TOKEN and Apple credentials without
 * having to export them manually in the shell.
 *
 * Usage (via npm scripts):
 *   node scripts/forge-publish.js --platform=darwin
 *   node scripts/forge-publish.js --platform=win32
 */
const { main } = require('./publish/main');

main().catch((error) => {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});

