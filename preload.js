const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld("copter", {
  bindCopter: () => ipcRenderer.send("bind-copter"),
  changeMotion: (motionType, delta) => ipcRenderer.send("change-motion", motionType, delta),
  setMotion: (motionType, delta) => ipcRenderer.send("set-motion", motionType, delta),
  disconnectCopter: () => ipcRenderer.send("disconnect-copter"),
  receive: (channel, callback) => ipcRenderer.on(channel, callback)
});