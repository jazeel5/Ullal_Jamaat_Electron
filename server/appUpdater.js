// Keep update state in the main process so closing a dialog never loses a download.
function createAppUpdater({ autoUpdater, app, ipcMain, log, send, env = process.env }) {
  const supported = app.isPackaged && !env.PORTABLE_EXECUTABLE_DIR;
  let operation = null;
  let downloadReady = false;
  let state = {
    status: "idle",
    currentVersion: app.getVersion(),
    version: null,
    percent: 0,
    transferred: 0,
    total: 0,
    error: null,
    retryAction: null,
    dialogOpen: false,
  };

  autoUpdater.logger = log;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  // Older releases reused the installer filename for the portable executable.
  // Fetch the complete installer rather than patching a potentially wrong cache.
  // electron-updater still validates the SHA-512 checksum and configured signature.
  autoUpdater.disableDifferentialDownload = true;

  const getState = () => ({ ...state });
  const publish = (changes) => {
    state = { ...state, ...changes };
    send("updater:state", getState());
    return getState();
  };
  const fail = (error, retryAction = operation || "check") => {
    log.error("Application update failed:", error);
    return publish({
      status: "error",
      error: error?.message || String(error),
      retryAction,
      dialogOpen: true,
    });
  };
  const unavailable = () => publish({
    status: "unsupported",
    error: env.PORTABLE_EXECUTABLE_DIR
      ? "Automatic updates require the installed version of E-Jamaat. Please install the E-Jamaat Setup application."
      : "Update checks are available in the installed application, not the development preview.",
  });

  autoUpdater.on("checking-for-update", () => publish({ status: "checking", error: null }));
  autoUpdater.on("update-available", (info) => {
    log.info("Update available:", info.version);
    publish({ status: "available", version: info.version, error: null, dialogOpen: true });
  });
  autoUpdater.on("update-not-available", () => {
    publish({ status: "not-available", version: null, error: null });
  });
  autoUpdater.on("download-progress", (progress) => {
    publish({
      status: "downloading",
      percent: Math.max(0, Math.min(100, Number(progress.percent) || 0)),
      transferred: progress.transferred || 0,
      total: progress.total || 0,
    });
  });
  autoUpdater.on("update-downloaded", (info) => {
    downloadReady = true;
    log.info("Update downloaded and verified:", info.version);
    publish({ status: "downloaded", version: info.version, percent: 100, error: null, dialogOpen: true });
  });
  autoUpdater.on("error", (error) => {
    fail(error, state.status === "installing" ? "install" : operation || "check");
  });

  async function checkForUpdates({ manual = true } = {}) {
    if (manual) publish({ dialogOpen: true });
    if (!supported) return unavailable();
    if (operation || downloadReady || state.status === "installing") return getState();

    operation = "check";
    publish({ status: "checking", error: null, retryAction: null });
    try {
      const result = await autoUpdater.checkForUpdates();
      if (!result) unavailable();
    } catch (error) {
      fail(error, "check");
    } finally {
      operation = null;
    }
    return getState();
  }

  function openUpdates() {
    publish({ dialogOpen: true });
    if (state.status === "idle" || state.status === "not-available") {
      return checkForUpdates();
    }
    return getState();
  }

  async function downloadUpdate() {
    if (!supported) return unavailable();
    if (operation || downloadReady || state.status === "installing") return getState();
    if (state.status !== "available" && !(state.status === "error" && state.retryAction === "download")) {
      return getState();
    }

    operation = "download";
    publish({ status: "downloading", percent: 0, transferred: 0, total: 0, error: null, retryAction: null, dialogOpen: true });
    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      fail(error, "download");
    } finally {
      operation = null;
    }
    return getState();
  }

  function installUpdate() {
    if (!downloadReady || state.status === "installing") return getState();
    publish({ status: "installing", error: null, dialogOpen: true });
    try {
      autoUpdater.quitAndInstall(false, true);
    } catch (error) {
      fail(error, "install");
    }
    return getState();
  }

  ipcMain.handle("updater:get-state", getState);
  ipcMain.handle("updater:open", openUpdates);
  ipcMain.handle("updater:check", () => checkForUpdates());
  ipcMain.handle("updater:download", downloadUpdate);
  ipcMain.handle("updater:install", installUpdate);
  ipcMain.handle("updater:close", () => publish({ dialogOpen: false }));

  return { getState, checkForUpdates, openUpdates, downloadUpdate, installUpdate };
}

module.exports = { createAppUpdater };
