const utils = require('bin/utils');
const rfs = require("rotating-file-stream");
const fs = require("fs");

const infoLogPath = 'log/info.log';
const debugLogPath = 'log/debug.log';

const runningInDocker = _isDockerized();

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

function _isDockerized() {
  try {
    if (fs.existsSync('/.dockerenv')) {
      return true
    }
  } catch (err) {
    console.error(err);
    return false
  }
}

function debug(message) {
  if (process.env.NODE_ENV != "production") {
    let logMessage = utils.currentTimeString() + " [DEBUG] " + message;
    if (runningInDocker) {
      console.log(logMessage);
    } else {
      debugLog.write(logMessage + "\n");
    }
  }
}

function info(message) {
  let logMessage = utils.currentTimeString() + " [INFO]  " + message;
  if (runningInDocker) {
    console.log(logMessage);
  } else {
    _doLog(infoLog, logMessage);
  }
}

function warn(message) {
  let logMessage = utils.currentTimeString() + " [WARN]  " + message;
  if (runningInDocker) {
    console.warn(logMessage);
  } else {
    _doLog(infoLog, logMessage);
  }
}

function error(message) {
  let logMessage = utils.currentTimeString() + " [ERROR] " + message;
  if (runningInDocker) {
    console.error(logMessage);
  } else {
    _doLog(infoLog, logMessage);
  }
}

module.exports.debug = debug;
module.exports.info = info;
module.exports.warn = warn;
module.exports.error = error;
