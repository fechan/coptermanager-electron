document.getElementById("bind").onclick = () => {
  window.copter.bindCopter();
};

document.getElementById("throttle-up").onclick = () => {
  window.copter.changeThrottle(0x0F);
};

document.getElementById("throttle-down").onclick = () => {
  window.copter.changeThrottle(-0x0F);
};

window.copter.receive("log", (event, data) => {
  document.getElementById("log").innerHTML += data + "\n";
})