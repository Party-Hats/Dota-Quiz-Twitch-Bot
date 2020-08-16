const log = require("./log.js");

function create(maxExcluded, cooldownPercent) {
  let cooldownSize = Math.ceil(maxExcluded * (cooldownPercent / 100));
  if (cooldownSize === maxExcluded) {
    // Making sure there is always at least one number, that can be drawn.
    // Effectively disables a cooldown of 100%
    cooldownSize--;
  }
  log.info("Creating randomness for max " + maxExcluded + " and cooldown "
      + cooldownPercent + "% and thus cooldown size " + cooldownSize);

  return {
    _drawnNums: new Array(cooldownSize),
    draw: function () {
      let num;
      do {
        num = Math.floor(Math.random() * maxExcluded);
      } while (this._drawnNums.includes(num));
      this._drawnNums.push(num);
      this._drawnNums.shift();
      return num;
    }
  };
}

module.exports.create = create;