const express = require('express');
const router = express.Router();
const questions = require('bin/questions.js');

router.get('/', function (req, res, next) {
  res.render('add', {});
});

router.post('/', function (req, res) {
  let newQuestion = req.body.question;
  let isBinary = req.body.binaryQuestion;
  let binaryAnswer = req.body.binaryAnswer;
  let newAnswers = req.body.answers;
  if (typeof newAnswers === "string") {
    newAnswers = [newAnswers];
  }
  let newQuestionObject = {
    question: newQuestion
  };
  if (isBinary === 'on') {
    newQuestionObject.binary = true;
    if (binaryAnswer === 'on') {
      newQuestionObject.binaryAnswer = true;
    } else {
      newQuestionObject.binaryAnswer = false;
    }
  } else {
    newQuestionObject.answers = newAnswers;
  }
  questions.addQuestion(newQuestionObject);
  res.render('add', {});
});

module.exports = router;
