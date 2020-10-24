const fs = require('fs');
const axios = require('axios');
const log = require('bin/log');

const token = (fs.readFileSync('token') + '').replace('oauth:', '').trim();
const config = JSON.parse(fs.readFileSync('config/config.json', "utf-8"));

const FIND_CHANNEL_URL = "https://api.twitch.tv/kraken/users?login=${channelName}";
const FIND_STREAM_URL = "https://api.twitch.tv/kraken/streams/${channelId}";

let cachedChannelId;

async function _findChannelId() {
  let channelName = config.channelName;
  let url = FIND_CHANNEL_URL.replace("${channelName}", channelName);
  log.debug("Trying to find channelId with url: " + url);
  let response;
  try {
    response = await axios.get(
        url,
        {
          headers: {
            'Accept': 'application/vnd.twitchtv.v5+json',
            'Authorization': 'OAuth ' + token
          }
        });
    log.debug("Found response body when trying to find channelId: " + JSON.stringify(response.data));
  } catch (error) {
    log.error('Could not find channelId for channel "' + channelName + '": ' + error);
    return;
  }
  cachedChannelId = response.data.users[0]._id;
  log.debug('Found and cached channelId: "' + cachedChannelId + '"');
}

async function isChannelOnline() {
  if (!cachedChannelId) {
    log.debug("Did not have channelId cached. Loading it");
    await _findChannelId();
    log.debug('Finished loading channelID: "' + cachedChannelId + '"');
  }
  if (!cachedChannelId) {
    // If there was an error with finding the channel id we just assume its online
    log.debug("There seems to have been an error with loading the channelId, as it is null");
    return true;
  }

  let url = FIND_STREAM_URL.replace('${channelId}', cachedChannelId);
  log.debug("Trying to find stream data with url: " + url);
  let response;
  try {
    response = await axios.get(
        url,
        {
          headers: {
            'Accept': 'application/vnd.twitchtv.v5+json',
            'Authorization': 'OAuth ' + token
          }
        });
    log.debug("Found response body when trying to find channelId: " + JSON.stringify(response.data));
  } catch (error) {
    log.error('Could not find stream for channelId "' + cachedChannelId + '": ' + error);
    return true;
  }
  let isOnline = response.data.stream != null;
  log.debug("Stream is online: " + isOnline);
  return isOnline;
}

module.exports.isChannelOnline = isChannelOnline;