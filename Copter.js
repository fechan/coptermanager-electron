/**
 * Coptermanager command codes
 */
const COMMAND_CODES = {
  BIND: 0x01,
  THROTTLE: 0x02,
  RUDDER: 0x03,
  AILERON: 0x04,
  ELEVATOR: 0x05,
  DISCONNECT: 0x0B
}

const COMMAND_RANGES = {
  0x02: [0x00, 0xFF],
  0x03: [0x34, 0xCC],
  0x04: [0x45, 0xC3],
  0x05: [0x3E, 0xBC]
}

/**
 * Get the serial message buffer for binding a new copter
 * @returns {Buffer} Serial message buffer
 */
function bindCopterCommand() {
  let checksum = (256 - ((0x00 + COMMAND_CODES.BIND + 0x01) % 256)) & 0xFF;
  return Buffer.from([0x00, COMMAND_CODES.BIND, 0x01, checksum]);
}

class Copter {
  /**
   * Create an object representing a quadricopter and its motion
   * @param {Number} copterId Copter ID
   */
  constructor(copterId) {
    this.copterId = copterId;
    this.motion = { // set throttle, aileron, etc. to 0
      0x02: 0x00,
      0x03: 0x00,
      0x04: 0x00,
      0x05: 0x00
    }
  }

  /**
   * Get the serial message buffer for sending an arbitrary command
   * @param {Number} commandCode Command code
   * @param {Number} value Command value
   * @returns {Buffer} Serial message buffer
   */
  rawCommand(commandCode, value) {
    let checksum = (256 - ((this.copterId + commandCode + value) % 256)) & 0xFF;
    return Buffer.from([this.copterId, commandCode, value, checksum]);
  }

  /**
   * Get the serial message buffer for changing the quadricopter's motion
   * @param {Number} command Command code (from COMMAND_CODES)
   * @param {Number} delta Change in motion value
   * @returns {Buffer} Serial message buffer
   */
  changeMotionCommand(command, delta) {
    let range = COMMAND_RANGES[command];
    let newMotion = Math.max(Math.min(this.motion[command] + delta, range[1]), range[0]);
    return this.rawCommand(command, newMotion);
  }
  
  disconnectCopterCommand() {
    return this.rawCommand(COMMAND_CODES.DISCONNECT, 0x00);
  }
  
  /**
   * Set the quadricopter's motion to a specific value
   * @param {Number} command Command code (from COMMAND_CODES)
   * @param {Number} delta Change in motion value
   */
  commitMotion(command, delta) {
    let range = COMMAND_RANGES[command];
    this.motion[command] = Math.max(Math.min(this.motion[command] + delta, range[1]), range[0]);
  }
}

module.exports = {
  COMMAND_CODES: COMMAND_CODES,
  bindCopterCommand: bindCopterCommand,
  Copter: Copter
};