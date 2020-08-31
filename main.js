require('app-module-path').addPath('.');

/*
 * Run WebServer
 */
require('bin/www.js');

/*
 * Run bot
 */
let bot = require('bin/bot.js');
bot.setup();
