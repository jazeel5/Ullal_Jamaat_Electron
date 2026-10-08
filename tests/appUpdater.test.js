const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const { createAppUpdater } = require("../server/appUpdater");

function setup({ packaged = true, env = {} } = {}) {
  const updater = new EventEmitter();
  const messages = [];
  const handlers = new Map();
  let checkCount = 0;
  let installCount = 0;
  updater.checkForUpdates = async () => {
    checkCount++;
    updater.emit("update-available", { version: "1.0.5" });
    return { updateInfo: { version: "1.0.5" } };
  };
  updater.downloadUpdate = async () => {
    updater.emit("update-downloaded", { version: "1.0.5" });
    return ["setup.exe"];
  };
  updater.quitAndInstall = () => { installCount++; };
  const controller = createAppUpdater({
    autoUpdater: updater,
    app: { isPackaged: packaged, getVersion: () => "1.0.4" },
    ipcMain: { handle: (name, handler) => handlers.set(name, handler) },
    log: { info() {}, error() {} },
    send: (channel, state) => messages.push({ channel, state }),
    env,
  });
  return { updater, controller, handlers, messages, checks: () => checkCount, installs: () => installCount };
}

test("download failure at 6% stays visible and can be retried before explicit installation", async () => {
  const { updater, controller, handlers, installs } = setup();
  await controller.checkForUpdates();
  updater.downloadUpdate = async () => {
    updater.emit("download-progress", { percent: 6, transferred: 6, total: 100 });
    handlers.get("updater:close")();
    const error = new Error("sha512 checksum mismatch");
    updater.emit("error", error);
    throw error;
  };
  await controller.downloadUpdate();
  assert.equal(controller.getState().status, "error");
  assert.equal(controller.getState().percent, 6);
  assert.equal(controller.getState().dialogOpen, true);
  assert.equal(controller.getState().retryAction, "download");
  assert.match(controller.getState().error, /checksum/);
  controller.installUpdate();
  assert.equal(installs(), 0);

  updater.downloadUpdate = async () => {
    for (const percent of [6, 18, 67, 100]) {
      updater.emit("download-progress", { percent, transferred: percent, total: 100 });
      assert.equal(controller.getState().percent, percent);
      controller.installUpdate();
      assert.equal(installs(), 0, "100% downloaded still needs verification");
    }
    updater.emit("update-downloaded", { version: "1.0.5" });
  };
  await controller.downloadUpdate();
  assert.equal(controller.getState().status, "downloaded");
  assert.equal(installs(), 0);
  assert.equal(updater.autoInstallOnAppQuit, false);
  assert.equal(updater.autoDownload, false);
  assert.equal(updater.disableDifferentialDownload, true);
  controller.installUpdate();
  controller.installUpdate();
  assert.equal(installs(), 1);
});

test("concurrent menu and toolbar actions do not start duplicate checks or downloads", async () => {
  const { updater, controller, handlers } = setup();
  let resolveCheck;
  let checks = 0;
  updater.checkForUpdates = () => {
    checks++;
    return new Promise((resolve) => { resolveCheck = resolve; });
  };
  const checking = controller.checkForUpdates({ manual: false });
  assert.equal(controller.getState().dialogOpen, false);
  await controller.checkForUpdates();
  assert.equal(checks, 1);
  assert.equal(controller.getState().dialogOpen, true);
  updater.emit("update-available", { version: "1.0.5" });
  resolveCheck({ updateInfo: { version: "1.0.5" } });
  await checking;

  let resolveDownload;
  let downloads = 0;
  updater.downloadUpdate = () => {
    downloads++;
    return new Promise((resolve) => { resolveDownload = resolve; });
  };
  const downloading = controller.downloadUpdate();
  await controller.downloadUpdate();
  await controller.checkForUpdates();
  assert.equal(downloads, 1);
  assert.equal(checks, 1);
  handlers.get("updater:close")();
  updater.emit("download-progress", { percent: 60, transferred: 60, total: 100 });
  assert.equal(controller.getState().dialogOpen, false);
  controller.openUpdates();
  assert.equal(controller.getState().percent, 60);
  assert.equal(controller.getState().dialogOpen, true);
  updater.emit("update-downloaded", { version: "1.0.5" });
  resolveDownload([]);
  await downloading;
  await controller.checkForUpdates();
  assert.equal(controller.getState().status, "downloaded");
  assert.equal(checks, 1);
});

test("manual checks report no update and network errors support retry", async () => {
  const { updater, controller } = setup();
  updater.checkForUpdates = async () => { throw new Error("Network unavailable"); };
  await controller.openUpdates();
  assert.equal(controller.getState().retryAction, "check");
  assert.equal(controller.getState().dialogOpen, true);
  updater.checkForUpdates = async () => {
    updater.emit("update-not-available", { version: "1.0.4" });
    return { updateInfo: { version: "1.0.4" } };
  };
  await controller.checkForUpdates();
  assert.equal(controller.getState().status, "not-available");
  assert.equal(controller.getState().error, null);
});

test("development and portable builds explain why installation updates are unavailable", async () => {
  for (const options of [{ packaged: false }, { env: { PORTABLE_EXECUTABLE_DIR: "C:\\portable" } }]) {
    const { controller, checks, installs } = setup(options);
    await controller.openUpdates();
    await controller.downloadUpdate();
    controller.installUpdate();
    assert.equal(controller.getState().status, "unsupported");
    assert.equal(controller.getState().dialogOpen, true);
    assert.equal(checks(), 0);
    assert.equal(installs(), 0);
  }
});

test("an installer launch error remains visible and permits a second install attempt", async () => {
  const { updater, controller } = setup();
  await controller.checkForUpdates();
  await controller.downloadUpdate();
  updater.quitAndInstall = () => updater.emit("error", new Error("Unable to start installer"));
  controller.installUpdate();
  assert.equal(controller.getState().status, "error");
  assert.equal(controller.getState().retryAction, "install");
  updater.quitAndInstall = () => {};
  controller.installUpdate();
  assert.equal(controller.getState().status, "installing");
});
