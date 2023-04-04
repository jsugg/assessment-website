const express = require('express');
require('dotenv').config();
const app = express();
const ejs = require('ejs');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');

app.use(express.json());

function sendEmail(name, email, answers, speakingRecording, pronunciationRecording, assessmentScore) {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333;">
            <h1 style="font-size: 24px; color: #4caf50;">English Proficiency Assessment Results</h1>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <h2 style="font-size: 20px; color: #333;">Assessment Score:</h2>
            <p>${assessmentScore}%</p>
            <h2 style="font-size: 20px; color: #333;">Answers:</h2>
            <ul style="list-style-type: none; padding-left: 0;">
                ${answers.map((answer, index) => `<li><strong>Q${index + 1}:</strong> ${answer}</li>`).join('')}
            </ul>
            <h2 style="font-size: 20px; color: #333;">Speaking Recording:</h2>
            <p>Download the file: <a href="${speakingRecording}">${speakingRecording}</a></p>
            <h2 style="font-size: 20px; color: #333;">Pronunciation Recording:</h2>
            <p>Download the file: <a href="${pronunciationRecording}">${pronunciationRecording}</a></p>
        </div>
    `;

    const mailOptions = {
        from: process.env.EMAIL,
        to: 'juanpedrosugg@gmail.com',
        subject: `Assessment answers for ${name}, ${email}`,
        html: htmlContent,
        attachments: [{
            filename: 'speaking-recording.webm',
            content: speakingRecording
        },
        {
            filename: 'pronunciation-recording.webm',
            content: pronunciationRecording
        }] 
    };

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "login",
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        },
        port: 465,
        host: "smtp.gmail.com"
    });

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/submit', async (req, res) => {
    const { name, email, answers, speakingRecording, pronunciationRecording } = req.body;
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

    sendEmail( name, email, answers, speakingRecording, pronunciationRecording, assessmentScore );

    res.send('Thank you! Your answers have been submitted.');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});