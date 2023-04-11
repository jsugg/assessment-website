const nodemailer = require('nodemailer');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const { isEmail } = require('validator');

class Emailer {
  #email = process.env.EMAIL || null;

  #pass = process.env.EMAIL_PASSWORD || null;

  #port = process.env.SMTP_PORT || null;

  #host = process.env.SMTP_HOST || null;

  #service = process.env.SMTP_SERVICE || null;

  #type = process.env.SMTP_TYPE || null;

  #auth;

  #mailOptions;

  #hasNullValues(obj) {
    const hasNullValue = (object) => Object.values(object).some((value) => value === null || (typeof value === 'object' && hasNullValue(value)));
    return hasNullValue(obj);
  }

  auth({
    service, email, pass, port, host, type,
  } = {}) {
    this.#auth = {
      auth: {
        type: type || this.#type,
        user: email || this.#email,
        pass: pass || this.#pass,
      },
      port: port || this.#port,
      host: host || this.#host,
    };
    this.#auth.service = service || this.#service;

    return this.#hasNullValues(this.#auth) ? new Error('Missing parameters for emailer authentication') : true;
  }

  composeEmail({
    from,
    recipientEmail,
    userName,
    userEmail,
    subject,
    htmlContent,
    htmlTemplate,
    attachments,
    answers,
    speakingRecording,
    pronunciationRecording,
    assessmentScore,
  } = {}) {
    if (!recipientEmail || !userName || !userEmail || !subject) {
      throw new Error('Missing required fields in email composition');
    }

    if (!isEmail(userEmail)) {
      throw new Error('Invalid email format');
    }

    const html = htmlTemplate
      ? ejs.render(fs.readFileSync(path.resolve(htmlTemplate), 'utf8'), {
        name: userName,
        email: userEmail,
        answers,
        speakingRecording,
        pronunciationRecording,
        assessmentScore,
      })
      : htmlContent;

    this.#mailOptions = {
      from: from || process.env.EMAIL,
      to: recipientEmail,
      subject,
      html,
      attachments: attachments || [
        {
          filename: 'speaking-recording.webm',
          content: speakingRecording,
        },
        {
          filename: 'pronunciation-recording.webm',
          content: pronunciationRecording,
        },
      ],
    };
  }

  async sendEmail({
    name, email, answers, speakingRecording, pronunciationRecording, assessmentScore,
  } = {}) {
    if (!this.#auth || this.#hasNullValues(this.#auth)) {
      throw new Error('Missing parameters for emailer authentication');
    }

    if (!this.#mailOptions || !this.#mailOptions.to
      || !this.#mailOptions.subject || !this.#mailOptions.html) {
      throw new Error('Missing required fields in email options');
    }

    const transporter = nodemailer.createTransport(this.#auth);

    try {
      const info = await transporter.sendMail(this.#mailOptions);

      console.log(`Email sent to ${email} with message ID ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(error);
      if (error.code === 'EAUTH') {
        throw new Error('Invalid email credentials');
      } else if (error.code === 'ECONNECTION') {
        throw new Error('Unable to connect to email server');
      } else if (error.responseCode === 550) {
        throw new Error('Recipient email does not exist');
      } else {
        throw new Error('Failed to send email');
      }
    }
  }
}
module.exports = Emailer;
