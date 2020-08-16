const locks = require('locks');
const fs = require('fs');
const log = require('./log.js');

const storeLock = locks.createReadWriteLock();
const storeFilePath = "store";

if (!fs.existsSync(storeFilePath)) {
  storeLock.writeLock(function() {
    _setStore({});
  });
}

function readAll(callback) {
  storeLock.readLock(function() {
    let store = _getStore();
    storeLock.unlock();
    callback(store);
  })
}

function readForUser(user, callback) {
  storeLock.readLock(function() {
    let userData = _getStore()[user];
    storeLock.unlock();
    if (!userData) {
      callback(0);
    } else {
      callback(userData.score)
    }
  });
}

function writeToStore(user, updateWith) {
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
  storeLock.writeLock(function() {
    if (callback) {
      callback(_getStore());
    }
    _setStore({});
    storeLock.unlock();
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