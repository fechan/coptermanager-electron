const {app, BrowserWindow, ipcMain} = require("electron");
const SerialPort = require("serialport");
const Copter = require("./Copter.js");

const serial = new SerialPort("/dev/ttyACM0", {baudRate: 115200});

let win;

/**
 * Initialize serial port for quadcopter communication
 */
let serialMessageQueue = [];
let expectingResponse = false;
let currentCopter;

function sendNextSerialMessage() {
  if (serialMessageQueue.length > 0) {
    let message = serialMessageQueue.shift();
    serial.write(message);
    try {
      win.webContents.send("log", `Sent command ${message.toString("hex")}`);
    } catch (e) {
      console.error(e);
    }
    expectingResponse = true;
  }
}

function enqueueSerialMessage(message) {
  serialMessageQueue.push(message);
  if (!expectingResponse) {
    sendNextSerialMessage();
  }
}

function bindCopter() {
  enqueueSerialMessage(Copter.bindCopterCommand());
  serial.once("data", (data) => {
    let copterId = data.readUInt8(1);
    currentCopter = new Copter.Copter(copterId);
  })
}

function changeMotion(motionType, delta) {
  enqueueSerialMessage(currentCopter.changeMotionCommand(Copter.COMMAND_CODES[motionType], delta));
  serial.once("data", (data) => {
    //TODO: what happens when there's an error?
    currentCopter.commitChangeMotion(Copter.COMMAND_CODES.THROTTLE, delta);
  })
}

function setMotion(motionType, value) {
  enqueueSerialMessage(currentCopter.setMotionCommand(Copter.COMMAND_CODES[motionType], value));
  serial.once("data", (data) => {
    currentCopter.commitSetMotion(Copter.COMMAND_CODES[motionType], value);
  })
}

function disconnectCopter(closeApplication) {
  enqueueSerialMessage(currentCopter.disconnectCopterCommand());
  serial.once("data", (data) => {
    currentCopter = null;
    if (closeApplication) app.quit();
  })
}

/**
 * Start Electron
 */

const createWindow = () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: __dirname + "/preload.js"
    }
  });
  win.loadFile("renderer/index.html");
}

app.allowRendererProcessReuse = false;
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") disconnectCopter(true);
});
app.whenReady().then(() => {
  createWindow();

  serial.on("data", (data) => {
    expectingResponse = false;
    try {
      win.webContents.send("log", `Received data ${data.toString("hex")}`);
      win.webContents.send("copterState", currentCopter);
    } catch (e) {
      console.error(e);
    }
    sendNextSerialMessage();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  })
});

/**
 * Handle IPC messages
 */
ipcMain.on("bind-copter", (event, args) => {
  bindCopter();
});

ipcMain.on("change-motion", (event, motionType, delta) => {
  changeMotion(motionType, delta);
});

ipcMain.on("set-motion", (event, motionType, value) => {
  setMotion(motionType, value);
});

ipcMain.on("disconnect-copter", (event, args) => {
  disconnectCopter();
});