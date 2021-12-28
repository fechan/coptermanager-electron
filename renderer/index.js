const COMMAND_RANGES = {
  THROTTLE: [0x00, 0xFF],
  RUDDER: [0x34, 0xCC],
  AILERON: [0x45, 0xC3],
  ELEVATOR: [0x3E, 0xBC]
}

let copterMotion;
let startTime;
let recording = false;
let recordedFlight = []; // array of arrays of [timeMsSinceStart, copterMotions]
let playing = false;

// window.copter.bindCopter();
let bound = false;
let gamepadPollInterval = setInterval(pollGamepads, 500);

function pollGamepads() {
  let gamepads = navigator.getGamepads();
  for (let i = 0; i < gamepads.length; i++) {
    let gamepad = gamepads[i];
    if (gamepad) {
      document.getElementById("log").scrollTop = document.getElementById("log").scrollHeight 
      document.getElementById("log").innerHTML += `Gamepad connected at index ${gamepad.index}: ${gamepad.id}. It has ${gamepad.buttons.length} buttons and ${gamepad.axes.length} axes.\n`;
      clearInterval(gamepadPollInterval);
      controllerLoop();
    }
  }
}

/**
 * Scale a value from one range to another
 */
function scale (number, inMin, inMax, outMin, outMax) {
  return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function controllerLoop() {
  let gamepads = navigator.getGamepads();
  let gamepad = gamepads[0];
  if (bound && !playing) {
    window.copter.setMotion("RUDDER", scale(-gamepad.axes[0], -1, 1, COMMAND_RANGES.RUDDER[0], COMMAND_RANGES.RUDDER[1]) | 0);
    window.copter.changeMotion("THROTTLE", (-gamepad.axes[1] * COMMAND_RANGES.THROTTLE[1]) | 0);
    window.copter.setMotion("AILERON", scale(-gamepad.axes[2], -1, 1, COMMAND_RANGES.AILERON[0], COMMAND_RANGES.AILERON[1]) | 0);
    window.copter.setMotion("ELEVATOR", scale(-gamepad.axes[3], -1, 1, COMMAND_RANGES.ELEVATOR[0], COMMAND_RANGES.ELEVATOR[1]) | 0);
  }
  requestAnimationFrame(controllerLoop);
}

function playRecording() {
  playing = true;
  for (let keyFrame of recordedFlight) {
    setTimeout(() => {
      window.copter.setMotion("THROTTLE", keyFrame[1][0x02]);
      window.copter.setMotion("RUDDER", keyFrame[1][0x03]);
      window.copter.setMotion("AILERON", keyFrame[1][0x04]);
      window.copter.setMotion("ELEVATOR", keyFrame[1][0x05]);
    }, keyFrame[0]);
  }
  setTimeout(() => {playing = false;}, recordedFlight[recordedFlight.length - 1][0] + 1);
}

document.getElementById("bind").onclick = () => {window.copter.bindCopter();};

document.getElementById("disconnect").onclick = () => {window.copter.disconnectCopter(); bound = false};

document.getElementById("throttle-up").onclick = () => window.copter.changeMotion("THROTTLE", 0x0F);

document.getElementById("throttle-down").onclick = () => window.copter.changeMotion("THROTTLE", -0x0F);

document.getElementById("start-recording").onclick = () => {
  startTime = Date.now();
  recordedFlight = [[Date.now() - startTime, copterMotion]];
  recording = true;
  document.getElementById("recording").innerHTML = "";
};

document.getElementById("stop-recording").onclick = () => {
  recording = false;
  for (let keyFrame of recordedFlight) {
    let tableRow = document.createElement("tr");
    let timeCell = document.createElement("td");
    let motionCell = document.createElement("td");

    timeCell.innerHTML = keyFrame[0];
    motionCell.innerHTML = Object.values(keyFrame[1]).join(" ");

    tableRow.appendChild(timeCell);
    tableRow.appendChild(motionCell);
    document.getElementById("recording").appendChild(tableRow);
  }
};

document.getElementById("start-playback").onclick = playRecording;

window.copter.receive("log", (event, data) => {
  document.getElementById("log").innerHTML += data + "\n";
  if (data.includes("Received data 0001")) {
    bound = true;
  }
});

window.copter.receive("copterState", (event, data) => {
  if (recording) recordedFlight.push([Date.now() - startTime, data.motion]);
  copterMotion = data.motion;
  document.getElementById("throttle").innerHTML = data.motion[0x02];
  document.getElementById("rudder").innerHTML = data.motion[0x03];
  document.getElementById("aileron").innerHTML = data.motion[0x04];
  document.getElementById("elevator").innerHTML = data.motion[0x05];
});