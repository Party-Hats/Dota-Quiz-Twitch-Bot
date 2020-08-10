const tmi = require('tmi.js');
const fs = require('fs');
const store = require('./store.js');

const tokenFile = 'token';
const config = JSON.parse(fs.readFileSync('config.json', "utf-8"));
const client = new tmi.client(buildClientOpts());
const questions = JSON.parse(fs.readFileSync('questions.json', "utf-8"));
// Might later be extended to give the ability to choose between different locales
const lang = JSON.parse(fs.readFileSync('lang/german.json', 'utf-8'));

let currentQuestion = {};
let currentTimeout = undefined;
let running = false;

setup();

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
		console.log("All available questions:\n" + JSON.stringify(questions, null, " "));

		setInterval(ask, config.postQuestionIntervalInSeconds * 1000);
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
		console.log("Bot is not running. Skipping ask question");
		return;
	}

  currentQuestion = questions[Math.floor(Math.random() * questions.length)];

  let message = parseLocaleString(lang.askQuestion, {
				question: currentQuestion.question,
				answerPrefix: config.answerPrefix
			});

  client.say(config.channelName, message);
  console.log("Quiz question asked: " + message);
  console.log("Possible answers: " + JSON.stringify(currentQuestion.answers));
  return;
  // The timeout does not work currently as it is not really sync.
  if (config.questionTimeoutInSeconds > 0) {
    console.log("Question will timeout in " + config.questionTimeoutInSeconds + " seconds");
    currentTimeout = setTimeout(timeoutQuestion, config.questionTimeoutInSeconds * 1000);
  } else {
    console.log("Question timeout disabled");
  }
}

function timeoutQuestion() {
  resetTimeout();
  console.log("Question timed out. Resetting it");
  client.say(config.channelName, parseLocaleString(lang.questionTimedOut, {
  	question: currentQuestion.question,
		answer: currentQuestion.answers[0]
	}));
	currentQuestion = {};
}

function resetTimeout() {
  return; // todo
  if (currentTimeout !== undefined) {
    clearTimeout(currentTimeout);
  }
}

function resolveSpecialCommands(channel, user, message) {
	if (resolveAdminCommands(channel, user, message)) {
		return true;
	}
  let comms = config.commands;
  if (comms.personalScore === message) {
    store.readForUser(user, function(data) {
			client.say(channel, parseLocaleString(lang.commandScore, {
				user: user,
				scoreNumber: data
			}));
    });
    return true;
  } else if(comms.currentQuestion === message) {
  	client.say(channel, parseLocaleString(lang.askQuestion, {
			question: currentQuestion.question,
			answerPrefix: config.answerPrefix
		}));
  	return true;
	}
  return false;
}

function resolveAdminCommands(channel, user, message) {
	let comms = config.adminCommands;
	if (comms.allScores === message) {
		if (config.channelAdmin === user) {
			store.readAll(function (data) {
				_sendMultilineScores(channel, data);
			});
			return true;
		}
	} else if (comms.reset === message) {
		if (config.channelAdmin === user) {
			store.resetStore(function (data) {
				client.say(channel, parseLocaleString(lang.commandReset, {}));
				_sendMultilineScores(channel, data);
			});
			return true;
		}
	} else if (comms.start === message) {
		if (config.channelAdmin === user) {
			running = true;
			client.say(channel, "Starting Bot. Question interval is "
					+ config.postQuestionIntervalInSeconds + "seconds");
			console.log("Starting bot");
			return true;
		}
	} else if (comms.stop === message) {
		if (config.channelAdmin === user) {
			running = false;
			client.say(channel, "Stopping Bot. Will not react to anything but commands");
			console.log("Stopping bot");
			return false;
		}
	} else {
		return false;
	}
	console.log("Invalid user tried to execute admin command. User: \""
			+ user + "\"; Command: \"" + message + "\"");
	return true;
}

function _sendMultilineScores(channel, data) {
  if (Object.keys(data).length === 0) {
    client.say(channel, parseLocaleString(lang.commandResetNobodyHasPoints, {}));
  }
  for (const [key, value] of Object.entries(data)) {
		client.say(channel, parseLocaleString(lang.commandScore, {
			user: key,
			scoreNumber: value.score
		}));
  }
}

function onMessageHandler (target, context, message, self) {
  if (self) { return; }

  let chatSender = context['display-name'].toLowerCase();
  if (resolveSpecialCommands(target, chatSender, message.trim())) {
    // Message was a special command and not an answer
    return;
  }

  if (!message.startsWith(config.answerPrefix)) { return; }

	if (!running) {
		console.log("Not reacting to message from user \"" + chatSender
				+ "\" as bot is disabled: " + message);
		return;
	}

  if (Object.keys(currentQuestion).length === 0 || currentQuestion.answers === null) {
  	if (config.reactToNoQuestion) {
			client.say(target, parseLocaleString(lang.noQuestion, {
				user: chatSender
			}));
		}
    return;
  }

  // Remove whitespaces from chat message
  let answer = message.replace(/\s/g, '');
  answer = answer.substr(config.answerPrefix.length);

  if (currentQuestion.answers.includes(answer)) {
    client.say(target, parseLocaleString(lang.correctAnswer, {
    	user: chatSender
		}));
    store.incrementStore(chatSender);
    resetTimeout();
    currentQuestion = {};
  } else {
  	if (config.reactToAnswer) {
			client.say(target, parseLocaleString(lang.wrongAnswer, {
				user: chatSender
			}));
		}
  }
}

function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}