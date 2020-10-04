require('app-module-path').addPath('.');
const log = require('bin/log');

try {
  /*
   * Run WebServer
   */
  require('bin/www.js');

  /*
   * Run bot
   */
  let bot = require('bin/bot.js');
  bot.setup();
} catch (e) {
  console.log(e);
  log.error(e);
  process.exit(1);
}