const fs = require('fs');
const log = require('bin/log');
const lang = JSON.parse(fs.readFileSync('lang/german.json', 'utf-8'));

function forSeconds(seconds) {
  log.debug("Parsing time for seconds: " + seconds);
  let date = new Date(seconds * 1000);
  let secs = date.getSeconds();
  let mins = date.getMinutes();
  let hrs = date.getHours() - 1;

  let ret = "";
  if (hrs > 0) {
    ret += hrs + " " + lang.hours + " ";
  }
  if (mins > 0) {
    ret += date.getMinutes() + " " + lang.minutes + " ";
  }
  if (secs > 0) {
    ret += date.getSeconds() + " " + lang.seconds + " ";
  }
  ret = ret.substr(0, ret.length -1);
  log.debug("Parsed time \"" + ret + "\" for seconds: " + seconds);
  return ret;
}

module.exports.forSeconds = forSeconds;