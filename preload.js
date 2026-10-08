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
  getUpdateState: () => ipcRenderer.invoke("updater:get-state"),
  openUpdates: () => ipcRenderer.invoke("updater:open"),
  checkForUpdates: () => ipcRenderer.invoke("updater:check"),
  downloadUpdate: () => ipcRenderer.invoke("updater:download"),
  quitAndInstall: () => ipcRenderer.invoke("updater:install"),
  closeUpdates: () => ipcRenderer.invoke("updater:close"),
  onUpdateState: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on("updater:state", listener);
    return () => ipcRenderer.removeListener("updater:state", listener);
  },
});
