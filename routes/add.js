const express = require('express');
const router = express.Router();
const questions = require('../bin/questions.js');

router.get('/', function (req, res, next) {
  res.render('add', {});
});

router.post('/', function (req, res) {
  let newQuestion = req.body.question;
  let newAnswers = req.body.answers;
  if (typeof newAnswers === "string") {
    newAnswers = [newAnswers];
  }
  questions.addQuestion({
    question: newQuestion,
    answers: newAnswers
  });
  res.render('add', {});
});

module.exports = router;
