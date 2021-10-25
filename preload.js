const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld("copter", {
  bindCopter: () => ipcRenderer.send("bind-copter"),
  changeThrottle: (delta) => ipcRenderer.send("change-throttle", delta),
  disconnectCopter: () => ipcRenderer.send("disconnect-copter"),
  receive: (channel, callback) => ipcRenderer.on(channel, callback)
});