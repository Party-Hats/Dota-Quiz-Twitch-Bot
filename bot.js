const tmi = require('tmi.js');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('config.json'));
const opts = {
  identity: config.identity,
  channels: [
    config.channelName
  ]
};
const client = new tmi.client(opts);
const questions = JSON.parse(fs.readFileSync('questions.json'));
var currentQuestion = {};
var currentTimeout = undefined;

function setup() {
  client.on('chat', onMessageHandler);
  client.on('connected', onConnectedHandler);
  client.connect();

  console.log("All available questions:\n" + JSON.stringify(questions));

  setInterval(ask, config.postQuestionIntervalInSeconds * 1000);
//setTimeout(ask, 2000);
ask();
}

function ask() {
  currentQuestion = questions[Math.floor(Math.random() * questions.length)];

  var message = currentQuestion.question + " (Rate mit: " + config.answerPrefix + "<Antwort>)";

  client.say(config.channelName, message);
  console.log("Quiz question asked: " + message);
  console.log("Possible answers: " + JSON.stringify(currentQuestion.answers))
  if (config.questionTimeoutInSeconds > 0) {
    console.log("Question will timeout in " + config.questionTimeoutInSeconds + " seconds");
    currentTimeout = setTimeout(timeoutQuestion, config.questionTimeoutInSeconds * 1000);
  } else {
    console.log("Question timeout disabled");
  }
}

function timeoutQuestion() {
  restTimeout();
  currentQuestion = {};
  console.log("Question timed out. Resetting it");
  client.say(config.channelName, "Tja, leider zu lang gebraucht. Viel Glück bei der nächsten Frage");
}

function restTimeout() {
  currentTimeout = undefined;
  if (currentTimeout !== undefined) {
    clearTimeout(currentTimeout);
  }
}

// Called every time a message comes in
function onMessageHandler (target, context, message, self) {
  if (self) { return; }
  if (!message.startsWith(config.answerPrefix)) { return; }

  var chatSender = context['display-name'];

  if (Object.keys(currentQuestion).length === 0 || currentQuestion.answers === null) {
    client.say(target, "Tut mir leid " + chatSender + ". Aktuell ist leider keine Frage offen =(");
    return;
  }

  // Remove whitespace from chat message
  var answer = message.replace(/\s/g, '');
  answer = answer.substr(config.answerPrefix.length);

  if (currentQuestion.answers.includes(answer)) {
    client.say(target, "Sehr gut " + chatSender + ", richtige Anwort!");
    resetTimeout();
    currentQuestion = {};
  } else {
    client.say(target, "Leider falsch " + chatSender + ". Versuch es nochmal");
  }
}

function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}

setup();