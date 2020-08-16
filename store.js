const locks = require('locks');
const fs = require('fs');
const log = require('./log.js');

const storeLock = locks.createReadWriteLock();
const storeFilePath = "store";

if (!fs.existsSync(storeFilePath)) {
  log.info("No store file found. Initiating now");
  storeLock.writeLock(function() {
    _setStore({});
    log.info("Initialized store file");
  });
}

function readAll(callback) {
  log.debug("Start reading all scores from store");
  storeLock.readLock(function() {
    let store = _getStore();
    storeLock.unlock();
    callback(store);
    log.debug("Read all scores from store");
  })
}

function readForUser(user, callback) {
  log.debug("Start reading scores for user \"" + user + "\"");
  storeLock.readLock(function() {
    let userData = _getStore()[user];
    storeLock.unlock();
    if (!userData) {
      callback(0);
    } else {
      callback(userData.score)
    }
    log.debug("Read all data for user \"" + user + "\" from store: "
        + JSON.stringify(userData));
  });
}

function writeToStore(user, updateWith) {
  log.debug("Start writing to store for user \"" + user + "\"");
  storeLock.writeLock(function() {
    let loadedStore = _getStore();
    let userData = loadedStore[user];
    if (!userData) {
      userData = {
        "score": 0
      };
    }
    userData.score = userData.score + updateWith;
    loadedStore[user] = userData;
    _setStore(loadedStore);
    log.info("Saved to store with updated data for user \"" + user + "\": "
				+ JSON.stringify(userData));
    storeLock.unlock();
  });
}

function incrementStore(user) {
  writeToStore(user, 1);
}

function resetStore(callback) {
  log.debug("Start resetting store")
  storeLock.writeLock(function() {
    if (callback) {
      callback(_getStore());
    }
    _setStore({});
    storeLock.unlock();
    log.debug("Reset store");
  });
}

function _getStore() {
  return JSON.parse(fs.readFileSync(storeFilePath, "utf-8"));
}

function _setStore(jsonStore) {
  fs.writeFileSync(storeFilePath, JSON.stringify(jsonStore, null, " "));
}

module.exports.readAll = readAll;
module.exports.readForUser = readForUser;
module.exports.writeToStore = writeToStore;
module.exports.incrementStore = incrementStore;
module.exports.resetStore = resetStore;