const utils = require('bin/utils');
const rfs = require("rotating-file-stream");

const infoLogPath = 'log/info.log';
const debugLogPath = 'log/debug.log';

const infoLog = rfs.createStream(infoLogPath, {
  size: "10M",
  compress: true,
  maxFiles: 5
});
const debugLog = rfs.createStream(debugLogPath, {
  size: "10M",
  compress: true,
  maxFiles: 5
});

function _doLog(file, message) {
  file.write(message + "\n");
}

function debug(message) {
  let logMessage = utils.currentTimeString() + " [DEBUG] " + message;
  debugLog.write(logMessage + "\n");
}

function info(message) {
  let logMessage = utils.currentTimeString() + " [INFO]  " + message;
  _doLog(infoLog, logMessage);
}

function warn(message) {
  let logMessage = utils.currentTimeString() + " [WARN]  " + message;
  _doLog(infoLog, logMessage);
}

function error(message) {
  let logMessage = utils.currentTimeString() + " [ERROR] " + message;
  _doLog(infoLog, logMessage);
}

module.exports.debug = debug;
module.exports.info = info;
module.exports.warn = warn;
module.exports.error = error;