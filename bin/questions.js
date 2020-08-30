const fs = require('fs');
const log = require('./log.js');
const random = require('./randomWithCooldown.js');
const interval = require('./deltaCountingInterval.js');
const questionsFilePath = '../config/questions.json';

let _askCallback;
let _intervalSec;
let _timeoutSec;
let _cooldownPercent;

let questions;
let questionDrawer;
let currentQuestion = {};
let currentTimeout = undefined;
let questionInterval;

function initWithInterval(askCallback, intervalSec, timeoutSec, cooldownPercent) {
  _askCallback = askCallback;
  _intervalSec = intervalSec;
  _timeoutSec = timeoutSec;
  _cooldownPercent = cooldownPercent;
  _doInit();
}

function refreshQuestions() {
  log.info("Refreshing questions");
  _doInit();
}

function _doInit() {
  questions = JSON.parse(fs.readFileSync(questionsFilePath, "utf-8"));
  if (questions.length == 0) {
    throw "There were no questions found in the configuration!";
  }
  questionDrawer = random.create(questions.length, _cooldownPercent);
  log.info("Total loaded questions: " + questions.length);
  log.debug("All available questions:\n"
      + JSON.stringify(questions, null, " "));
  if (questionInterval) {
    questionInterval.clear();
  }
  questionInterval = interval.create(_askCallback, _intervalSec);
}

function newQuestion(callback) {
  /*
   * This is a really bad way of making sure there are no race conditions when
   * the questions are currently persisted. This whole class has to be
   * refactored to use a lock
   */
  let error;
  let retries = 10;
  do {
    try {
      currentQuestion = questions[questionDrawer.draw()];
      error = undefined;
    } catch (e) {
      error = e;
      retries--;
      log.debug("Error when loading current question. Retrying. " + e);
    }
  } while(error && retries > 0)

  if (_timeoutSec > 0) {
    log.info("Question will timeout in " + _timeoutSec + " seconds");
    currentTimeout = setTimeout(function() {
      log.info("Question timed out. Resetting it");
      let timedOutQuestion = currentQuestion;
      _doTimeoutQuestion();
      callback(timedOutQuestion);
    }, _timeoutSec * 1000);
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

function addQuestion(question) {
  questions.push(question);
  _doWriteQuestions();
  refreshQuestions();
}

function removeQuestion(question) {
  for (let questionCount in questions) {
    let quest = questions[questionCount];
    if (quest.question === question) {
      questions.splice(questionCount, 1);
      break;
    }
  }
  _doWriteQuestions();
  refreshQuestions();
}

function _doWriteQuestions() {
  fs.writeFileSync(questionsFilePath, JSON.stringify(questions, null, ' '));
}

function getSecondsUntilNextQuestion() {
  return questionInterval.getSecondsRemaining();
}

function getCurrentQuestion() {
  return currentQuestion;
}

function getAllQuestions() {
  return questions;
}

module.exports.initWithInterval = initWithInterval;
module.exports.refreshQuestions = refreshQuestions;
module.exports.newQuestion = newQuestion;
module.exports.isAnswerCorrect = isAnswerCorrect;
module.exports.isQuestionAvailable = isQuestionAvailable;
module.exports.addQuestion = addQuestion;
module.exports.removeQuestion = removeQuestion;
module.exports.getSecondsUntilNextQuestion = getSecondsUntilNextQuestion;
module.exports.getCurrentQuestion = getCurrentQuestion;
module.exports.getAllQuestions = getAllQuestions;
