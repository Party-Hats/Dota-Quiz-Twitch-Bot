const locks = require('locks');
const fs = require('fs');
const log = require('bin/log');
const utils = require('bin/utils');

const storeLock = locks.createReadWriteLock();
const STORE_FILE_PATH = "store";
const STORE_ARCHIVE_FOLDER_NAME = "storeArchive";

/*
 * Making sure the store file exists
 */
if (!fs.existsSync(STORE_FILE_PATH)) {
  log.info("No store file found. Initiating now");
  storeLock.writeLock(function () {
    _setStore({});
    log.info("Initialized store file");
  });
}

/*
 * Making sure the store archive folder exists
 */
if (!fs.existsSync(STORE_ARCHIVE_FOLDER_NAME)) {
  log.info("No store archive folder found. Creating it");
  fs.mkdirSync(STORE_ARCHIVE_FOLDER_NAME);
  log.info("Created store archive folder");
}

function readAll(callback) {
  log.debug("Start reading all scores from store");
  storeLock.readLock(function () {
    let store = _getStore();
    storeLock.unlock();
    callback(_orderedScoreList(store));
    log.debug("Read all scores from store");
  })
}

/**
 * TODO This is not great. It has to be reworked when moving the scores to a db: #29
 * @private
 */
function _orderedScoreList(storeJson) {
  let ret = [];
  for (let username in storeJson) {
    ret.push({
      "user": username,
      "score": storeJson[username].score
    });
  }
  ret.sort(function (a, b) {
    return b.score - a.score;
  })
  return ret;
}

function readForUser(user, callback) {
  log.debug("Start reading scores for user \"" + user + "\"");
  storeLock.readLock(function () {
    let currentStore = _getStore();
    storeLock.unlock();
    let userData = currentStore[user];
    let ordered = _orderedScoreList(currentStore);
    if (!userData) {
      callback(0, ordered.length + 1);
    } else {
      let index = ordered.findIndex(function (item, i) {
        return item.user === user;
      });
      callback(userData.score, index + 1);
    }
    log.debug("Read all data for user \"" + user + "\" from store: "
        + JSON.stringify(userData));
  });
}

function writeToStore(user, updateWith) {
  log.debug("Start writing to store for user \"" + user + "\"");
  storeLock.writeLock(function () {
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
  storeLock.writeLock(function () {
    let currentStoreData = _getStore();
    if (callback) {
      callback(_orderedScoreList(currentStoreData));
    }
    _backupScoreFile(currentStoreData);
    _setStore({});
    storeLock.unlock();
    log.debug("Reset store");
  });
}

/**
 * This is temporary, as all scores will be moved to a database eventually
 * @private
 */
function _backupScoreFile(data) {
  let fileName = (utils.currentTimeString() + '')
      .replace(/:/g, "-")
      .replace(/ /g, "_")
      + ".json";
  fs.writeFileSync(STORE_ARCHIVE_FOLDER_NAME + "/" + fileName,
      JSON.stringify(data, null, " "));
}

function _getStore() {
  return JSON.parse(fs.readFileSync(STORE_FILE_PATH, "utf-8"));
}

function _setStore(jsonStore) {
  fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(jsonStore, null, " "));
}

module.exports.readAll = readAll;
module.exports.readForUser = readForUser;
module.exports.writeToStore = writeToStore;
module.exports.incrementStore = incrementStore;
module.exports.resetStore = resetStore;