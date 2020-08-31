const log = require("bin/log");

function create(maxExcluded, cooldownPercent, initWith) {
  let initDataGiven = initWith !== undefined;
  let max = initDataGiven ? initWith.length : maxExcluded;
  let cooldownSize = Math.ceil(max * (cooldownPercent / 100));
  if (cooldownSize === max) {
    // Making sure there is always at least one number, that can be drawn.
    // Effectively disables a cooldown of 100%
    cooldownSize--;
  }
  log.debug("Creating randomness for max " + max + " and cooldown "
      + cooldownPercent + "% and thus cooldown size " + cooldownSize);
  if (initDataGiven) {
    log.debug("Initialized randomness with array: " + JSON.stringify(initWith));
  }

  return {
    _drawnNums: initDataGiven ? initWith : new Array(cooldownSize),
    getDrawnNums: function () {
      return this._drawnNums;
    },
    draw: function () {
      log.debug("Start finding random with cooldown list: " + this._drawnNums);
      let num;
      do {
        num = Math.floor(Math.random() * max);
        log.debug("Found random number: " + num);
      } while (this._drawnNums.includes(num));
      log.debug("Using allowed random number: " + num);
      this._drawnNums.push(num);
      this._drawnNums.shift();
      log.debug(
          "Found random number with new cooldown list: " + this._drawnNums)
      return num;
    }
  };
}

module.exports.create = create;