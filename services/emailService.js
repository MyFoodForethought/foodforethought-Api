const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});

const sendVerificationEmail = async (user, token) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: 'Please verify your email',
      text: `Hi ${user.fullName}, please verify your email by clicking on the following link: \nhttps://foodforethought-api.onrender.com/api/verify-email?token=${token}`,
    };

    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully');
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

module.exports = { sendVerificationEmail };
