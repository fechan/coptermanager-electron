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

function controllerLoop() {
  let gamepads = navigator.getGamepads();
  let gamepad = gamepads[0];
  if (bound) {
    window.copter.changeThrottle((-gamepad.axes[1] * 0x0F) | 0);
  }
  requestAnimationFrame(controllerLoop);
}

document.getElementById("bind").onclick = () => {window.copter.bindCopter();};

document.getElementById("disconnect").onclick = () => {window.copter.disconnectCopter(); bound = false};

document.getElementById("throttle-up").onclick = () => window.copter.changeThrottle(0x0F);

document.getElementById("throttle-down").onclick = () => window.copter.changeThrottle(-0x0F);


window.copter.receive("log", (event, data) => {
  document.getElementById("log").innerHTML += data + "\n";
  if (data.includes("Received data 0001")) {
    bound = true;
  }
});