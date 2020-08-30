const tmi = require('tmi.js');
const fs = require('fs');
const store = require('./store.js');
const log = require('./log.js');
const timeConverter = require('./timeConverter.js');
const questions = require('./questions.js');

const tokenFile = '../token';
const config = JSON.parse(fs.readFileSync('../config/config.json', "utf-8"));
// Might later be extended to give the ability to choose between different locales
const lang = JSON.parse(fs.readFileSync('../lang/german.json', 'utf-8'));
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

function ask() {
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
}

function timeoutQuestion(timedOutQuestion) {
  client.say(config.channelName, parseLocaleString(lang.questionTimedOut, {
    question: timedOutQuestion.question,
    answer: timedOutQuestion.answers[0],
    newQuestionIn: timeConverter.forSeconds(
        questions.getSecondsUntilNextQuestion())
  }));
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
  let comms = config.commands;
  if (comms.personalScore.toLowerCase() === message) {
    log.info("User \"" + user + "\" sent command to get own score");
    store.readForUser(user, function (data, rank) {
      client.say(channel, parseLocaleString(lang.commandScore, {
        user: user,
        scoreNumber: data,
        userRank: rank
      }));
    });
    return true;
  } else if (comms.currentQuestion.toLowerCase() === message) {
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
  }
  return false;
}

function resolveAdminCommands(channel, user, message) {
  let comms = config.adminCommands;
  if (comms.allScores.toLowerCase() === message) {
    if (config.channelAdmin === user) {
      log.info("Admin user \"" + user + "\" sent command to get all scores");
      store.readAll(function (data) {
        _sendMultilineScores(channel, data);
      });
      return true;
    }
  } else if (comms.reset.toLowerCase() === message) {
    if (config.channelAdmin === user) {
      log.info("Admin user \"" + user + "\" sent command to reset all scores");
      store.resetStore(function (data) {
        client.say(channel, parseLocaleString(lang.commandReset, {}));
        _sendMultilineScores(channel, data);
      });
      return true;
    }
  } else if (comms.start.toLowerCase() === message) {
    if (config.channelAdmin === user) {
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
      return true;
    }
  } else if (comms.stop.toLowerCase() === message) {
    if (config.channelAdmin === user) {
      log.info("Admin user \"" + user + "\" sent command to stop bot");
      running = false;
      client.say(channel,
          "Stopping Bot. Will not react to anything but commands");
      log.info("Stopped bot");
      return false;
    }
  } else {
    return false;
  }
  log.warn("Invalid user tried to execute admin command. User: \""
      + user + "\"; Command: \"" + message + "\"");
  return true;
}

function _sendMultilineScores(channel, data) {
  if (data.length === 0) {
    client.say(channel,
        parseLocaleString(lang.commandResetNobodyHasPoints, {}));
  }
  for (let i = 0; i < data.length; i++) {
    let user = data[i].user;
    let score = data[i].score;
    let rank = i + 1;
    log.debug("User \"" + user + "\" had " + score + " points with rank " + rank);
    client.say(channel, parseLocaleString(lang.commandScore, {
      "user": user,
      "scoreNumber": score,
      "userRank": rank
    }));
  }
}

function onConnectedHandler(addr, port) {
  log.info(`* Connected to ${addr}:${port}`);
  log.info(
      "Bot running. Make sure to start it using \"" + config.adminCommands.start
      + "\"");
}

module.exports.setup = setup;
