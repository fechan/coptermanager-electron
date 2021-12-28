const COMMAND_RANGES = {
  THROTTLE: [0x00, 0xFF],
  RUDDER: [0x34, 0xCC],
  AILERON: [0x45, 0xC3],
  ELEVATOR: [0x3E, 0xBC]
}

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
  if (bound) {
    window.copter.setMotion("RUDDER", scale(-gamepad.axes[0], -1, 1, COMMAND_RANGES.RUDDER[0], COMMAND_RANGES.RUDDER[1]) | 0);
    window.copter.changeMotion("THROTTLE", (-gamepad.axes[1] * 0xFF) | 0);
    window.copter.setMotion("AILERON", scale(-gamepad.axes[2], -1, 1, COMMAND_RANGES.AILERON[0], COMMAND_RANGES.AILERON[1]) | 0);
    window.copter.setMotion("ELEVATOR", scale(-gamepad.axes[3], -1, 1, COMMAND_RANGES.ELEVATOR[0], COMMAND_RANGES.ELEVATOR[1]) | 0);
  }
  requestAnimationFrame(controllerLoop);
}

document.getElementById("bind").onclick = () => {window.copter.bindCopter();};

document.getElementById("disconnect").onclick = () => {window.copter.disconnectCopter(); bound = false};

document.getElementById("throttle-up").onclick = () => window.copter.changeMotion("THROTTLE", 0x0F);

document.getElementById("throttle-down").onclick = () => window.copter.changeMotion("THROTTLE", -0x0F);


window.copter.receive("log", (event, data) => {
  document.getElementById("log").innerHTML += data + "\n";
  if (data.includes("Received data 0001")) {
    bound = true;
  }
});

window.copter.receive("copterState", (event, data) => {
  document.getElementById("throttle").innerHTML = data.motion[0x02];
  document.getElementById("rudder").innerHTML = data.motion[0x03];
  document.getElementById("aileron").innerHTML = data.motion[0x04];
  document.getElementById("elevator").innerHTML = data.motion[0x05];
});