# Vue Electron App

This project uses **Electron Forge** for packaging and publishing.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite renderer only |
| `npm run electron:dev` | Start renderer + Electron in development mode |
| `npm run electron:package` | Package the app (unpacked) |
| `npm run electron:make` | Build installable artifacts (current platform) |
| `npm run electron:make:mac` | Build macOS DMG artifacts |
| `npm run electron:make:win` | Build Windows Squirrel installer |
| `npm run electron:publish:mac` | Build and publish macOS artifacts to GitHub Releases |
| `npm run electron:publish:win` | Build and publish Windows artifacts to GitHub Releases |

## Artifact output

All artifacts are written to `dist_electron/`.

The `postMake` hook automatically generates `latest-mac.yml` (mac) and `latest.yml` (Windows) so `electron-updater` can resolve updates directly from GitHub Releases.

## macOS release requirements

Set these in `.env` (locally) or as GitHub Actions secrets:

| Variable | Description |
|---|---|
| `GH_TOKEN` / `GITHUB_TOKEN` | GitHub personal access token (repo scope) |
| `MAC_CERTS` | Base64-encoded Developer ID Application `.p12` certificate |
| `MAC_CERTS_PASSWORD` | Certificate password |
| `APPLE_ID` | Apple ID email |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password for notarization |
| `APPLE_TEAM_ID` | 10-character Apple team ID |
| `APPLE_SIGN_IDENTITY` | *(optional)* Override signing identity label |
| `MAC_ADHOC_SIGN` | Set to `true` only for local ad-hoc testing (not valid for auto-update releases) |

## Windows release requirements

| Variable | Description |
|---|---|
| `GH_TOKEN` / `GITHUB_TOKEN` | GitHub token (same as mac) |

## Quick try

```bash
npm ci
npm run electron:make:mac   # macOS
npm run electron:make:win   # Windows (requires Wine on mac/linux)
```
