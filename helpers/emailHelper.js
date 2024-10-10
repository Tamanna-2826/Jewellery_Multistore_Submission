// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: "projectsarvadhi@gmail.com",
//         pass: "aabf fktz tzwi rmmg",
//       },
//   });

// // Reusable function to send email
// function sendEmail(to, subject, htmlContent) {
//     const mailOptions = {
//       from: "projectsarvadhi@gmail.com",
//       to,
//       subject,
//       html: htmlContent,
//     };
  
//     // Send the email
//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         console.error("Error sending email:", error);
//       } else {
//         console.log("Email sent:", info.response);
//       }
//     });
//   }
  
//   module.exports = { sendEmail };

// emailHelper.js

const nodemailer = require("nodemailer");
require('dotenv').config(); // To load environment variables

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "projectsarvadhi@gmail.com",
   pass: "aabf fktz tzwi rmmg",
  },
});

/**
 * Sends an email using the configured transporter
 * @param {string} to - Recipient's email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - Email content in HTML format
 * @returns {Promise} - Resolves when email is sent, rejects on error
 */
function sendEmail(to, subject, htmlContent) {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: htmlContent,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        reject(error);
      } else {
        console.log("Email sent:", info.response);
        resolve(info);
      }
    });
  });
}

module.exports = { sendEmail };