const { contextBridge, ipcRenderer } = require("electron");


contextBridge.exposeInMainWorld("ipcRenderer", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  sendSync: (channel, data) => ipcRenderer.sendSync(channel, data), // 👈 ADD THIS
  on: (channel, func) =>
    ipcRenderer.on(channel, (event, ...args) => func(...args)),
  once: (channel, func) =>
    ipcRenderer.once(channel, (event, ...args) => func(...args)),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
});

contextBridge.exposeInMainWorld("electronAPI", {
  checkForUpdates: () => ipcRenderer.send("check_for_updates"),
  onUpdateAvailable: (callback) => ipcRenderer.on("update_available", callback),
  onUpdateNotAvailable: (callback) => ipcRenderer.on("update_not_available", callback),
  onDownloadProgress: (callback) => ipcRenderer.on("download_progress", callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on("update_downloaded", callback),
  quitAndInstall: () => ipcRenderer.send("quit_and_install"),
});
