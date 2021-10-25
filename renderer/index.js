// window.copter.bindCopter();

// setInterval(() => {
//   const gamepad = window.navigator.getGamepads()[0];
//   window.copter.changeThrottle(gamepad.axes[1] * 0x08);
//   console.log(`Left stick at (${gamepad.axes[0]}, ${gamepad.axes[1]})` );
//   console.log(`Right stick at (${gamepad.axes[2]}, ${gamepad.axes[3]})` );
// }, 100);

document.getElementById("bind").onclick = () => window.copter.bindCopter();

document.getElementById("disconnect").onclick = () => window.copter.disconnectCopter();

document.getElementById("throttle-up").onclick = () => window.copter.changeThrottle(0x0F);

document.getElementById("throttle-down").onclick = () => window.copter.changeThrottle(-0x0F);


window.copter.receive("log", (event, data) => {
  document.getElementById("log").innerHTML += data + "\n";
});