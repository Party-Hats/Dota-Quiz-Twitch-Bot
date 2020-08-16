function create(callback, intervalInSeconds) {
  let obj = {
    _secondsRemaining: intervalInSeconds,
    _start: function() {
      setInterval(this._tick, 1000, this);
    },
    _tick: function(that) {
      that._secondsRemaining--;
      if (that._secondsRemaining <= 0) {
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