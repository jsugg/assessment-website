const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const path = require('path');
const { body, validationResult } = require('express-validator');

dotenv.config();

const app = express();
const ejs = require('ejs');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index');
});

app.post(
  '/submit',
  body('name').trim().escape().notEmpty()
    .withMessage('Name field is required.'),
  body('email').trim().escape().notEmpty()
    .withMessage('Email field is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.'),
  body('answers').isArray().withMessage('Answers should be an array of strings.').notEmpty()
    .withMessage('Please provide your answers.'),
  body('speakingRecording').notEmpty().withMessage('Please provide your speaking recording.'),
  body('pronunciationRecording').notEmpty().withMessage('Please provide your pronunciation recording.'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name, email, answers, speakingRecording, pronunciationRecording,
    } = req.body;
    const correctAnswers = ['b', 'c', 'd', 'c', 'a', 'd', 'a', 'a', 'a', 'c', 'a', 'a', 'a', 'c', 'c', 'a', 'c', 'a'];

    // Calculate the number of correct answers
    let correctAnswerCount = 0;
    for (let i = 0; i < correctAnswers.length; i++) {
      if (answers[i] === correctAnswers[i]) {
        correctAnswerCount++;
      }
    }
    // Calculate the assessmentScore based on the number of correct answers
    const totalQuestions = correctAnswers.length;
    const assessmentScore = Math.round((correctAnswerCount / totalQuestions) * 100);

    sendEmail(name, email, answers, speakingRecording, pronunciationRecording, assessmentScore);

    res.send('Thank you! Your answers have been submitted.');
  },
);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
