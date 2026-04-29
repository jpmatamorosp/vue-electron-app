const { autoUpdater } = require('electron-updater');
const { dialog, ipcMain } = require('electron');
const pkg = require('../package.json');

let mainWindow = null;
let isCheckingManually = false;

function parseRepoSlug(repositoryValue) {
  if (!repositoryValue) return null;

  if (typeof repositoryValue === 'string') {
    const githubShort = repositoryValue.match(/^github:([^/]+)\/([^/]+)$/i);
    if (githubShort) {
      return { owner: githubShort[1], repo: githubShort[2] };
    }

    const githubUrl = repositoryValue.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?$/i);
    if (githubUrl) {
      return { owner: githubUrl[1], repo: githubUrl[2] };
    }
  }

  if (repositoryValue && typeof repositoryValue === 'object') {
    if (repositoryValue.owner && repositoryValue.name) {
      return { owner: repositoryValue.owner, repo: repositoryValue.name };
    }

    if (typeof repositoryValue.url === 'string') {
      return parseRepoSlug(repositoryValue.url);
    }
  }

  return null;
}

function configureFeedUrl() {
  const repo = parseRepoSlug(pkg.repository);
  if (!repo) {
    console.warn('Auto-updater: could not parse GitHub repository from package.json.');
    return;
  }

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: repo.owner,
    repo: repo.repo,
  });
}

function initUpdater(win) {
  mainWindow = win;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  configureFeedUrl();

  autoUpdater.on('checking-for-update', () => {
    sendToRenderer('update-checking');
  });

  autoUpdater.on('update-available', async (info) => {
    sendToRenderer('update-available', info);

    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Actualización disponible',
      message: `La versión ${info.version} está disponible.`,
      detail: '¿Deseas descargarla ahora?',
      buttons: ['Descargar', 'Más tarde'],
      defaultId: 0,
      cancelId: 1,
    });

    if (response === 0) {
      autoUpdater.downloadUpdate();
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    sendToRenderer('update-not-available', info);
    if (isCheckingManually) {
      isCheckingManually = false;
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Sin actualizaciones',
        message: 'Estás usando la última versión.',
        detail: `Versión actual: ${info.version}`,
      });
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    sendToRenderer('update-download-progress', progress);
  });

  autoUpdater.on('update-downloaded', async (info) => {
    sendToRenderer('update-downloaded', info);

    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Actualización lista',
      message: 'Actualización descargada correctamente.',
      detail: 'Reinicia la aplicación para aplicarla. ¿Deseas reiniciar ahora?',
      buttons: ['Reiniciar ahora', 'Más tarde'],
      defaultId: 0,
      cancelId: 1,
    });

    if (response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err);
    sendToRenderer('update-error', { message: err.message });
    if (isCheckingManually) {
      isCheckingManually = false;
      dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: 'Error de actualización',
        message: 'No se pudo verificar actualizaciones.',
        detail: err.message,
      });
    }
  });

  // IPC handler for manual check from renderer
  ipcMain.handle('check-for-updates', () => {
    return checkForUpdates(true);
  });

  // Auto-check after a short delay
  setTimeout(() => {
    checkForUpdates(false);
  }, 3000);
}

function checkForUpdates(manual = false) {
  isCheckingManually = manual;
  autoUpdater.checkForUpdates();
}

function sendToRenderer(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

module.exports = { initUpdater, checkForUpdates };
