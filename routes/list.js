const express = require('express');
const router = express.Router();
const questions = require('../bin/questions.js');

router.get('/', function (req, res, next) {
  res.render('list', {
    questions: questions.getAllQuestions()
  });
});

router.post('/', function (req, res, next) {
  let toDelete = req.body.toDelete;
  questions.removeQuestion(toDelete);
  res.render('list', {
    questions: questions.getAllQuestions()
  });
})

module.exports = router;