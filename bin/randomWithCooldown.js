const log = require("bin/log");

function create(maxExcluded, cooldownPercent) {
  let cooldownSize = Math.ceil(maxExcluded * (cooldownPercent / 100));
  if (cooldownSize === maxExcluded) {
    // Making sure there is always at least one number, that can be drawn.
    // Effectively disables a cooldown of 100%
    cooldownSize--;
  }
  log.debug("Creating randomness for max " + maxExcluded + " and cooldown "
      + cooldownPercent + "% and thus cooldown size " + cooldownSize);

  return {
    _drawnNums: new Array(cooldownSize),
    draw: function () {
      log.debug("Start finding random with cooldown list: " + this._drawnNums);
      let num;
      do {
        num = Math.floor(Math.random() * maxExcluded);
        log.debug("Found random number: " + num);
      } while (this._drawnNums.includes(num));
      log.debug("Using allowed random number: " + num);
      this._drawnNums.push(num);
      this._drawnNums.shift();
      log.debug("Found random number with new cooldown list: " + this._drawnNums)
      return num;
    }
  };
}

module.exports.create = create;