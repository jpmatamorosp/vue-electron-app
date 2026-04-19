/**
 * Post-install patch for electron-builder on Windows.
 * Fixes "Cannot create symbolic link" error when extracting winCodeSign/nsis caches.
 * The Go binary app-builder.exe passes -snld to 7za.exe which requires symlink
 * privileges. This patch redirects SZA_PATH to a wrapper that strips that flag.
 */
const fs = require('fs');
const path = require('path');

const utilPath = path.join(__dirname, 'node_modules', 'builder-util', 'out', 'util.js');

if (process.platform !== 'win32' || !fs.existsSync(utilPath)) {
  process.exit(0);
}

let content = fs.readFileSync(utilPath, 'utf8');

const marker = '// patched: 7za_wrapper';
if (content.includes(marker)) {
  console.log('postinstall: builder-util already patched');
  process.exit(0);
}

const original = `async function executeAppBuilder(args, childProcessConsumer, extraOptions = {}, maxRetries = 0) {
    const command = app_builder_bin_1.appBuilderPath;
    const env = {
        ...process.env,
        SZA_PATH: await (0, _7za_1.getPath7za)(),`;

const patched = `async function executeAppBuilder(args, childProcessConsumer, extraOptions = {}, maxRetries = 0) {
    ${marker}
    const command = app_builder_bin_1.appBuilderPath;
    let _szaPath = await (0, _7za_1.getPath7za)();
    if (process.platform === "win32") {
        const _wrapperPath = require("path").resolve(__dirname, "..", "..", "..", "7za_wrapper.cmd");
        if (require("fs").existsSync(_wrapperPath)) { _szaPath = _wrapperPath; }
    }
    const env = {
        ...process.env,
        SZA_PATH: _szaPath,`;

if (!content.includes(original)) {
  console.log('postinstall: builder-util source layout changed, patch skipped');
  process.exit(0);
}

content = content.replace(original, patched);
fs.writeFileSync(utilPath, content);
console.log('postinstall: patched builder-util to use 7za_wrapper.cmd for SZA_PATH');
