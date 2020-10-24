const fs = require('fs');
const log = require('bin/log');
const random = require('bin/randomWithCooldown');
const interval = require('bin/deltaCountingInterval');
const questionsFilePath = 'config/questions.json';

const questionDrawerName = "questionsRandom";
const questionDrawerPersistencePath = questionDrawerName + ".tmp";
const config = JSON.parse(fs.readFileSync('config/config.json', "utf-8"));

let _askCallback;
let _intervalSec;
let _timeoutSec;
let _cooldownPercent;
let _binaryQuestionWrongAnswers = [];

let questions;
let questionDrawer;
let currentQuestion = {};
let currentTimeout = undefined;
let questionInterval;

function initWithInterval(askCallback, intervalSec, timeoutSec,
    cooldownPercent) {
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

function _doInitQuestionDrawer() {
  if (fs.existsSync(questionDrawerPersistencePath)) {
    let questionDrawerFromPersistence = JSON.parse(
        fs.readFileSync(questionDrawerPersistencePath, 'UTF-8'));
    questionDrawer = random.create(questions.length, _cooldownPercent,
        questionDrawerFromPersistence);
    fs.unlink(questionDrawerPersistencePath, function (err) {
      if (err) {
        throw err;
      }
      log.info(
          "Deleted temporary questionDrawer persistence file after loading its content: "
          + questionDrawerPersistencePath);
    })
  } else {
    questionDrawer = random.create(questions.length, _cooldownPercent);
  }
}

function _doInit() {
  questions = JSON.parse(fs.readFileSync(questionsFilePath, "utf-8"));
  if (questions.length === 0) {
    throw "There were no questions found in the configuration!";
  }
  _doInitQuestionDrawer()
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
      _binaryQuestionWrongAnswers = [];
      error = undefined;
    } catch (e) {
      error = e;
      retries--;
      log.debug("Error when loading current question. Retrying. " + e);
    }
  } while (error && retries > 0)

  if (_timeoutSec > 0) {
    log.info("Question will timeout in " + _timeoutSec + " seconds");
    currentTimeout = setTimeout(function () {
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
  _binaryQuestionWrongAnswers = [];
}

function canAnswer(user) {
  return !_binaryQuestionWrongAnswers.includes(user);
}

function isAnswerCorrect(answer, user) {
  if (_binaryQuestionWrongAnswers.includes(user)) {
    return false;
  }
  // Remove whitespaces from answer
  answer = answer.replace(/\s/g, '').toLowerCase();
  let answerCorrect = findCorrectAnswers().includes(answer);
  if (answerCorrect) {
    _doTimeoutQuestion();
  } else {
    log.debug("Adding user \"" + user
        + "\" to blocked list, as answer was not correct. Current list: "
        + JSON.stringify(_binaryQuestionWrongAnswers));
    _binaryQuestionWrongAnswers.push(user);
  }
  return answerCorrect;
}

function findCorrectAnswers() {
  if (currentQuestion.binary === true) {
    if (currentQuestion.binaryAnswer) {
      return config.question.binary.trueAnswers;
    } else {
      return config.question.binary.falseAnswers;
    }
  }
  return currentQuestion.answers;
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

process.on("SIGINT", function () {
  if (questionDrawer !== undefined) {
    fs.writeFileSync(questionDrawerPersistencePath,
        JSON.stringify(questionDrawer.getDrawnNums()));
    log.info("Successfully persisted question drawer");
  } else {
    log.warn(
        "No question drawer was defined, so none is backed up for next startup");
  }
  process.exit(0);
});

module.exports.initWithInterval = initWithInterval;
module.exports.refreshQuestions = refreshQuestions;
module.exports.newQuestion = newQuestion;
module.exports.isAnswerCorrect = isAnswerCorrect;
module.exports.canAnswer = canAnswer;
module.exports.findCorrectAnswers = findCorrectAnswers;
module.exports.isQuestionAvailable = isQuestionAvailable;
module.exports.addQuestion = addQuestion;
module.exports.removeQuestion = removeQuestion;
module.exports.getSecondsUntilNextQuestion = getSecondsUntilNextQuestion;
module.exports.getCurrentQuestion = getCurrentQuestion;
module.exports.getAllQuestions = getAllQuestions;
