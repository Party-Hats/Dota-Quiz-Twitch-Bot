const log = require("./log.js");

function create(callback, intervalInSeconds) {
  log.debug("Creating couting interval with seconds: " + intervalInSeconds);
  let obj = {
    _secondsRemaining: intervalInSeconds,
    _start: function() {
      setInterval(this._tick, 1000, this);
    },
    _tick: function(that) {
      that._secondsRemaining--;
      log.debug("Ticking with seconds remaining: " + that._secondsRemaining);
      if (that._secondsRemaining <= 0) {
        log.debug("Executing callback as secondsRemaining reached 0");
        callback();
        that._secondsRemaining = intervalInSeconds;
      }
    },
    getSecondsRemaining: function () {
      // As the current second is already running,
      // its more accurate to to subtract that second
      return this._secondsRemaining - 1;
    }
  };
  obj._start();
  return obj;
}

module.exports.create = create;