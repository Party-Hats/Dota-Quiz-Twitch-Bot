const fs = require('fs');
const axios = require('axios');
const log = require('bin/log');

const token = (fs.readFileSync('token') + '').replace('oauth:', '');
const config = JSON.parse(fs.readFileSync('config/config.json', "utf-8"));

const FIND_CHANNEL_URL = "https://api.twitch.tv/kraken/users?login=${channelName}";
const FIND_STREAM_URL = "https://api.twitch.tv/kraken/streams/${channelId}";

let cachedChannelId;

async function _findChannelId() {
  let channelName = config.channelName;
  let url = FIND_CHANNEL_URL.replace("${channelName}", channelName);
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
  } catch (error) {
    log.error('Could not find channelId for channel "' + channelName + '": '
        + JSON.stringify(error.response.data));
    return;
  }
  cachedChannelId = response.data.users[0]._id;
}

async function isChannelOnline() {
  if (!cachedChannelId) {
    await _findChannelId();
  }
  if (!cachedChannelId) {
    // If there was an error with finding the channel id we just assume its online
    return true;
  }

  let url = FIND_STREAM_URL.replace('${channelId}', cachedChannelId);
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
  } catch (error) {
    log.error('Could not find stream for channelId "' + cachedChannelId + '": '
        + JSON.stringify(error.response.data));
    return true;
  }
  return response.data.stream != null;
}

module.exports.isChannelOnline = isChannelOnline;