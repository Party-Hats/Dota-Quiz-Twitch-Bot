const fs = require('fs');
const log = require('./log.js');
const random = require('./randomWithCooldown.js');
const interval = require('./deltaCountingInterval.js');
const questions = JSON.parse(fs.readFileSync('config/questions.json', "utf-8"));

let questionDrawer;
let currentQuestion = {};
let currentTimeout = undefined;
let questionInterval;
let timeoutInSeconds;

function initWithInterval(askCallback, intervalSec, timeoutSec, cooldownPercent) {
  questionDrawer = random.create(questions.length, cooldownPercent);
  timeoutInSeconds = timeoutSec;
  log.info("Total loaded questions: " + questions.length);
  log.debug("All available questions:\n"
      + JSON.stringify(questions, null, " "));
  questionInterval = interval.create(askCallback, intervalSec);
}

function newQuestion(callback) {
  currentQuestion = questions[questionDrawer.draw()];

  if (timeoutInSeconds > 0) {
    log.info("Question will timeout in " + timeoutInSeconds + " seconds");
    currentTimeout = setTimeout(function() {
      log.info("Question timed out. Resetting it");
      let timedOutQuestion = currentQuestion;
      _doTimeoutQuestion();
      callback(timedOutQuestion);
    }, timeoutInSeconds * 1000);
  } else {
    log.debug("No timeout configured");
  }

  return currentQuestion;
}

function _doTimeoutQuestion() {
  if (currentTimeout !== undefined) {
    log.debug("Reset timeout");
    clearTimeout(currentTimeout);
    currentTimeout = undefined;
  }
  currentQuestion = {};
}

function isAnswerCorrect(answer) {
  // Remove whitespaces from answer
  answer = answer.replace(/\s/g, '').toLowerCase();
  let answerCorrect = currentQuestion.answers.includes(answer);
  if (answerCorrect) {
    _doTimeoutQuestion();
  }
  return answerCorrect;
}

function isQuestionAvailable() {
  return !(Object.keys(currentQuestion).length === 0
      || currentQuestion.answers === null);
}

function getSecondsUntilNextQuestion() {
  return questionInterval.getSecondsRemaining();
}

function getCurrentQuestion() {
  return currentQuestion;
}

module.exports.initWithInterval = initWithInterval;
module.exports.newQuestion = newQuestion;
module.exports.isAnswerCorrect = isAnswerCorrect;
module.exports.isQuestionAvailable = isQuestionAvailable;
module.exports.getSecondsUntilNextQuestion = getSecondsUntilNextQuestion;
module.exports.getCurrentQuestion = getCurrentQuestion;