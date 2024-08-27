// const nodemailer = require('nodemailer');
// const { google } = require('googleapis');
// require('dotenv').config();

// const oAuth2Client = new google.auth.OAuth2(
//   process.env.GOOGLE_CLIENT_ID,
//   process.env.GOOGLE_CLIENT_SECRET,
//   'http://localhost:3000/oauth2callback'
// );

// oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

// async function sendTestEmail() {
//   try {
//     const { token } = await oAuth2Client.getAccessToken(); // Ensure the correct token is retrieved

//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         type: 'OAuth2',
//         user: process.env.EMAIL,
//         clientId: process.env.GOOGLE_CLIENT_ID,
//         clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//         refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
//         accessToken: token, // Use the token directly
//       },
//     });

//     const mailOptions = {
//       from: process.env.EMAIL,
//       to: 'your-test-email@example.com', // Replace with your test email
//       subject: 'Test Email',
//       text: 'This is a test email sent using Nodemailer with OAuth2.',
//     };

//     const result = await transporter.sendMail(mailOptions);
//     console.log('Email sent:', result);
//   } catch (error) {
//     console.error('Error sending email:', error);
//   }
// }

// sendTestEmail();

const nodemailer = require('nodemailer');
const { google } = require('googleapis');
require('dotenv').config();

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback'
);

oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

async function sendTestEmail() {
  try {
    const accessToken = await oAuth2Client.getAccessToken();
    console.log('Access Token:', accessToken.token); // Ensure token is valid

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: 'your-test-email@example.com', // Replace with your test email
      subject: 'Test Email',
      text: 'This is a test email sent using Nodemailer with OAuth2.',
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent:', result);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

sendTestEmail();
