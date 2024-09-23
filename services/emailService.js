const nodemailer = require('nodemailer');

// let transporter;

// const initializeTransporter = () => {
//   if (!transporter) {
//     transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL,
//         pass: process.env.PASSWORD
//       }
//     });
//   }
// };

// const sendVerificationEmail = async (user, token) => {

//   console.log('Sending verification email');
//   console.log('User:', user.email);
//   console.log('Verification token:', verificationToken);
//   try {
//     initializeTransporter();

//      // Use BASE_URL from environment variables
//      const verificationUrl = `${process.env.BASE_URL}/api/verify-email?token=${token}`;
//      console.log('Verification link:', verificationUrl);
     
//     const mailOptions = {
//       from: process.env.EMAIL,
//       to: user.email,
//       subject: 'Please verify your email',
//       text: `Hi ${user.fullName}, please verify your email by clicking on the following link: \n${verificationUrl}`,
//       html: `
//         <h1>Email Verification</h1>
//         <p>Hi ${user.fullName},</p>
//         <p>Please verify your email by clicking on the following link:</p>
//         <a href="${verificationUrl}">Verify Email</a>
//       `
//     };

//     const info = await transporter.sendMail(mailOptions);
//     console.log('Verification email sent successfully:', info.messageId);
//     return info;
//   } catch (error) {
//     console.error('Error sending verification email:', error);
//     throw new Error('Failed to send verification email');
//   }
// };









const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});

const sendVerificationEmail = async (user, token) => {
  try {
   
    const verificationUrl = `https://foodforethought-api-production.up.railway.app/api/verify-email?token=${token}`;
    const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: 'Email Verification.',
            text: `Hi ${user.fullName}, please verify your email by clicking on the following link: \n${verificationUrl}`,
            // text: `Hi ${user.fullName}, please verify your email by clicking on the following link: \nhttp://localhost:3000/api/verify-email?token=${token}`,
            html: `
              <h1>Email Verification</h1>
              <p>Hi ${user.fullName},</p>
              <p>Please verify your email by clicking on the following link:</p>
              <a href="${verificationUrl}">Verify Email</a>
            `
          };
      
    

    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully');
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};








const loginTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});

const sendLoginVerificationEmail = async (user, token) => {
  try {
      const verificationUrl = `https://foodforethought-api-production.up.railway.app/api/verify-login?token=${token}`;
      const mailOptions = {
          from: process.env.EMAIL,
          to: user.email,  // Ensure this is correctly populated
          subject: 'Please verify your email',
          text: `Hi ${user.fullName}, please verify your email by clicking on the following link: \n${verificationUrl}`,
          html: `
              <h1>Login Verification.</h1>
              <p>Hi ${user.fullName},</p>
              <p>Please verify your email by clicking on the following link:</p>
              <a href="${verificationUrl}">Verify Email</a>
          `
      };

      await loginTransporter.sendMail(mailOptions);
      console.log('Verification email sent successfully');
  } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
  }
};







module.exports = { sendVerificationEmail, sendLoginVerificationEmail };

