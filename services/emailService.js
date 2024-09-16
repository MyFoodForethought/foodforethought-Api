const nodemailer = require('nodemailer');

let transporter;

const initializeTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
      }
    });
  }
};

const sendVerificationEmail = async (user, token) => {
  try {
    initializeTransporter();

    const verificationUrl = process.env.NODE_ENV === 'production'
      ? `https://foodforethought-api.onrender.com/api/verify-email?token=${token}`
      : `http://localhost:3000/api/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: 'Please verify your email',
      text: `Hi ${user.fullName}, please verify your email by clicking on the following link: \n${verificationUrl}`,
      html: `
        <h1>Email Verification</h1>
        <p>Hi ${user.fullName},</p>
        <p>Please verify your email by clicking on the following link:</p>
        <a href="${verificationUrl}">Verify Email</a>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

module.exports = { sendVerificationEmail };



