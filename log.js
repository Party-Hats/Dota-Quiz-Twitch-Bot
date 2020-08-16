const utils = require('./utils.js');

function info(message) {
	// TODO create more log level functions
	console.log(utils.currentTimeString() + " [INFO] " + message);
}

module.exports.info = info;