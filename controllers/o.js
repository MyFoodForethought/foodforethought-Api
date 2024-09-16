// const axios = require('axios');
// const { promisify } = require('util');

// const sendUserDataToAI = async ({ tribe, state, age, gender, duration, dislikedMeals }) => {
//   try {
//     const apiUrl = 'http://213.199.35.161/get_mealplan/';
    
//     const params = {
//       tribe: String(tribe || ''),
//       state: String(state || ''),
//       age: Number(age || 0),
//       gender: String(gender || ''),
//       is_seven_days: duration === 'one week',
//       disliked_meals: Array.isArray(dislikedMeals) ? dislikedMeals.join(',') : String(dislikedMeals || ''),
//     };
    
//     console.log('Sending request to AI service with params:', params);
    
//     const timeoutPromise = promisify(setTimeout);
    
//     const response = await Promise.race([
//       axios.get(apiUrl, {
//         params,
//         headers: {
//           Authorization: `Bearer ${process.env.AI_API_TOKEN}`,
//           Accept: 'application/json'
//         },
//         timeout: 30000 // 30 seconds timeout
//       }),
//       timeoutPromise(30000).then(() => {
//         throw new Error('AI service request timed out');
//       })
//     ]);
    
//     console.log('Received response from AI service:', response.data);
    
//     return response.data;
//   } catch (error) {
//     console.error('Error in sendUserDataToAI:', error);
    
//     if (axios.isAxiosError(error)) {
//       if (error.response) {
//         console.error('AI service error response:', {
//           status: error.response.status,
//           data: error.response.data,
//           headers: error.response.headers,
//         });
//       } else if (error.request) {
//         console.error('No response received from AI service:', error.request);
//       } else {
//         console.error('Error setting up AI service request:', error.message);
//       }
//     } else {
//       console.error('Non-Axios error:', error.message);
//     }
    
//     throw new Error('Failed to generate meal plan');
//   }
// };

// module.exports = { sendUserDataToAI };











// const nodemailer = require('nodemailer');

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
//   try {
//     initializeTransporter();

//     const verificationUrl = process.env.NODE_ENV === 'production'
//       ? `https://foodforethought-api.onrender.com/api/verify-email?token=${token}`
//       : `http://localhost:3000/api/verify-email?token=${token}`;

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

// module.exports = { sendVerificationEmail };















// const verifyEmail = async (req, res) => {
//     const session = await mongoose.startSession();
//     session.startTransaction();
  
//     try {
//       console.log('Starting email verification process');
//       const { token } = req.query;
  
//       const user = await User.findOne({ verificationToken: token, isVerified: false }).session(session);
  
//       if (!user) {
//         console.log('Invalid token or user already verified');
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(400).json({ error: 'Invalid token or already verified' });
//       }
  
//       console.log('Updating user verification status');
//       user.isVerified = true;
//       user.verificationToken = undefined;
//       await user.save({ session });
  
//       console.log('Generating meal plan');
//       let mealPlanData;
//       try {
//         mealPlanData = await sendUserDataToAI({
//           tribe: user.tribe,
//           state: user.state,
//           age: user.age,
//           gender: user.gender,
//           duration: user.duration,
//           dislikedMeals: user.dislikedMeals
//         });
//       } catch (aiError) {
//         console.error('Error generating meal plan:', aiError);
//         mealPlanData = null; // or a default meal plan
//       }
  
//       console.log('Saving meal plan');
//       const mealPlan = new MealPlan({
//         userId: user._id,
//         duration: user.duration,
//         plan: mealPlanData
//       });
//       await mealPlan.save({ session });
  
//       console.log('Generating authentication token');
//       const authToken = auth.generateAuthToken(user);
  
//       await session.commitTransaction();
//       session.endSession();
  
//       console.log('Email verification process completed successfully');
//       res.status(200).json({
//         message: 'Email verified successfully',
//         mealPlan: mealPlanData,
//         token: authToken,
//         userData: user
//       });
//     } catch (error) {
//       console.error('Error in email verification process:', error);
//       await session.abortTransaction();
//       session.endSession();
      
//       if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
//         return res.status(503).json({ error: 'Database operation timed out. Please try again later.' });
//       }
//       res.status(500).json({ error: 'Failed to verify email' });
//     }
//   };