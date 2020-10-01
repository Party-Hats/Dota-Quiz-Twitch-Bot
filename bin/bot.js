const tmi = require('tmi.js');
const fs = require('fs');
const store = require('bin/store');
const log = require('bin/log');
const timeConverter = require('bin/timeConverter');
const questions = require('bin/questions');
const channelHelper = require('bin/channelHelper');

// Found by trial and error to be the maximum length for a chat message.
// All further characters are just removed
const MAX_CHAT_MESSAGE_LENGTH = 499;

const tokenFile = 'token';
const config = JSON.parse(fs.readFileSync('config/config.json', "utf-8"));
// Might later be extended to give the ability to choose between different locales
const lang = JSON.parse(fs.readFileSync('lang/german.json', 'utf-8'));
const client = new tmi.client(buildClientOpts());

let running = false;

function buildClientOpts() {
  let token = fs.readFileSync(tokenFile) + "";
  return {
    "channels": [
      config.channelName
    ],
    "identity": {
      "username": config.identity.username,
      "password": token
    }
  };
}

function setup() {
  client.on('chat', onMessageHandler);
  client.on('connected', onConnectedHandler);
  client.connect().then(function () {
    try {
      questions.initWithInterval(
          ask,
          config.postQuestionIntervalInSeconds,
          config.questionTimeoutInSeconds,
          config.questionCooldownPercent);
    } catch (e) {
      log.error(e);
      client.disconnect();
      process.exit(1);
    }
  });
}

function parseLocaleString(message, parameterMap) {
  for (const [key, value] of Object.entries(parameterMap)) {
    message = message.replace('${' + key + '}', value);
  }
  return message;
}

async function ask() {
  if (!running) {
    log.debug("Bot is not running. Skipping ask question");
    return;
  }

  let currentQuestion = questions.newQuestion(timeoutQuestion);

  let message = parseLocaleString(lang.askQuestion, {
    question: currentQuestion.question,
    timeout: timeConverter.forSeconds(config.questionTimeoutInSeconds),
    answerPrefix: config.answerPrefix
  });

  client.say(config.channelName, message);
  log.info("Quiz question asked: " + message);
  log.info("Possible answers: " + JSON.stringify(currentQuestion.answers));

  if (config.disableBotWhenChannelIsOffline) {
    let isOnline = await channelHelper.isChannelOnline();
    if (!isOnline) {
      running = false;
      let offlineMessage = "Disabled bot, as stream is offline. Will not react to answers for current question";
      client.say(config.channelName, offlineMessage);
      log.info(offlineMessage);
    }
  }
}

function timeoutQuestion(timedOutQuestion) {
  if (running) {
    client.say(config.channelName, parseLocaleString(lang.questionTimedOut, {
      question: timedOutQuestion.question,
      answer: timedOutQuestion.answers[0],
      newQuestionIn: timeConverter.forSeconds(
          questions.getSecondsUntilNextQuestion())
    }));
  }
}

function onMessageHandler(target, context, message, self) {
  if (self) {
    log.debug("Message was sent from self. Ignoring it: " + message);
    return;
  }

  message = message.toLowerCase();

  let chatSender = context['display-name'].toLowerCase();
  if (resolveSpecialCommands(target, chatSender, message.trim())) {
    log.debug("Message was command. Skipping check for answer: " + message);
    return;
  }

  if (!message.startsWith(config.answerPrefix)) {
    return;
  }

  if (!running) {
    log.debug("Not reacting to message from user \"" + chatSender
        + "\" as bot is disabled: " + message);
    return;
  }

  if (!questions.isQuestionAvailable()) {
    if (config.reactToNoQuestion) {
      client.say(target, parseLocaleString(lang.noQuestion, {
        user: chatSender
      }));
    } else {
      log.debug("Not reacting to no question as it is disabled in the config");
    }
    return;
  }

  let answer = message.substr(config.answerPrefix.length);

  if (questions.isAnswerCorrect(answer)) {
    log.info("User \"" + chatSender + "\" sent the correct answer");
    client.say(target, parseLocaleString(lang.correctAnswer, {
      user: chatSender,
      newQuestionIn: timeConverter.forSeconds(
          questions.getSecondsUntilNextQuestion())
    }));
    store.incrementStore(chatSender);
  } else {
    log.debug("User \"" + chatSender + "\" sent wrong answer: \"" + message
        + "\". Parsed: \"" + answer + "\"");
    if (config.reactToWrongAnswer) {
      client.say(target, parseLocaleString(lang.wrongAnswer, {
        user: chatSender
      }));
    }
  }
}

function resolveSpecialCommands(channel, user, message) {
  if (resolveAdminCommands(channel, user, message)) {
    return true;
  }
  const comms = new Map(
      Object.entries(config.commands).map(([k, v]) => ([v.toLowerCase(), k])));
  switch (comms.get(message)) {
    case "personalScore":
      log.info("User \"" + user + "\" sent command to get own score");
      store.readForUser(user, function (data, rank) {
        client.say(channel, parseLocaleString(lang.commandScore, {
          user: user,
          scoreNumber: data,
          userRank: rank
        }));
      });
      return true;
    case "currentQuestion":
      log.info("User \"" + user + "\" sent message to get current question");
      if (!questions.isQuestionAvailable()) {
        if (config.reactToNoQuestion) {
          client.say(target, parseLocaleString(lang.noQuestion, {
            user: chatSender
          }));
        } else {
          log.debug(
              "Not reacting to no question as it is disabled in the config");
        }
      } else {
        client.say(channel, parseLocaleString(lang.askQuestion, {
          question: questions.getCurrentQuestion().question,
          answerPrefix: config.answerPrefix
        }));
      }
      return true;
    default:
      return false;
  }
}

function resolveAdminCommands(channel, user, message) {
  const comms = new Map(Object.entries(config.adminCommands).map(
      ([k, v]) => ([v.toLowerCase(), k])));

  const isAdminUser = config.channelAdmin === user;
  const adminCommandIssued = comms.has(message);

  if (adminCommandIssued) {
    if (isAdminUser) {
      switch (comms.get(message)) {
        case "allScores":
          log.info(
              "Admin user \"" + user + "\" sent command to get all scores");
          store.readAll(function (data) {
            _sendMultilineScores(channel, data);
          });
          break;
        case "reset":
          log.info(
              "Admin user \"" + user + "\" sent command to reset all scores");
          store.resetStore(function (data) {
            client.say(channel, parseLocaleString(lang.commandReset, {}));
            _sendMultilineScores(channel, data);
          });
          break;
        case "start":
          log.info("Admin user \"" + user + "\" sent command to start bot");
          running = true;
          client.say(channel,
              parseLocaleString("Starting Quiz bot. Question interval: "
                  + "${inter}; Next question in ${next}", {
                inter: timeConverter.forSeconds(
                    config.postQuestionIntervalInSeconds),
                next: timeConverter.forSeconds(
                    questions.getSecondsUntilNextQuestion())
              }));
          log.info("Started bot");
          break;
        case "topScores":
          log.info(
              "Admin user \"" + user + "\" sent command to get top scores");
          store.readAll(function (data) {
            _sendMultilineScores(channel, data.slice(0, 10));
          });
          break;
        case "stop":
          log.info("Admin user \"" + user + "\" sent command to stop bot");
          running = false;
          client.say(channel,
              "Stopping Bot. Will not react to anything but commands");
          log.info("Stopped bot");
          return false;
        default:
          return false;
      }
      return true;
    } else {
      log.warn("Invalid user tried to execute admin command. User: \""
          + user + "\"; Command: \"" + message + "\"");
      return true;
    }
  }
  return false;
}

function _sendMultilineScores(channel, data) {
  if (data.length === 0) {
    client.say(channel,
        parseLocaleString(lang.commandResetNobodyHasPoints, {}));
  }
  let message = "";
  for (let i = 0; i < data.length; i++) {
    let user = data[i].user;
    let score = data[i].score;
    let rank = i + 1;
    log.debug(
        "User \"" + user + "\" had " + score + " points with rank " + rank);
    let nextMessage = parseLocaleString(lang.commandScoreShort, {
      "user": user,
      "scoreNumber": score,
      "userRank": rank
    });
    let messageWithNextMessage = message + " " + nextMessage;
    if (messageWithNextMessage.length < MAX_CHAT_MESSAGE_LENGTH) {
      message = messageWithNextMessage;
    } else {
      client.say(channel, message);
      message = nextMessage;
    }
  }
  client.say(channel, message);
}

function onConnectedHandler(addr, port) {
  log.info(`* Connected to ${addr}:${port}`);
  log.info(
      "Bot running. Make sure to start it using \"" + config.adminCommands.start
      + "\"");
}

module.exports.setup = setup;
