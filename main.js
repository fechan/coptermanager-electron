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
    win.webContents.send("log", `Sent command ${message.toString("hex")}`);
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

function changeThrottle(delta) {
  enqueueSerialMessage(currentCopter.changeMotionCommand(Copter.COMMAND_CODES.THROTTLE, delta));
  serial.once("data", (data) => {
    currentCopter.commitMotion(Copter.COMMAND_CODES.THROTTLE, delta);
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
  if (process.platform !== "darwin") app.quit();
});
app.whenReady().then(() => {
  createWindow();

  serial.on("data", (data) => {
    expectingResponse = false;
    win.webContents.send("log", `Received data ${data.toString("hex")}`);
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

ipcMain.on("change-throttle", (event, delta) => {
  changeThrottle(delta);
});