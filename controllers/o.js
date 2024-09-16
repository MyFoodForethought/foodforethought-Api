// const { User } = require('../models/user');
// const MealPlan = require('../models/mealPlan');
// const { Auth } = require('../middleware/auth');
// const { sendVerificationEmail } = require('../services/emailService');
// const { sendUserDataToAI } = require('../services/aiServices');
// const passport = require('passport');
// const crypto = require('crypto');
// const mongoose = require('mongoose');

// const auth = new Auth();

// // Verify Email
// const verifyEmail = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { token } = req.query;

//     const user = await User.findOne({ verificationToken: token, isVerified: false }).session(session);

//     if (!user) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ error: 'Invalid token or already verified' });
//     }

//     // Mark the user as verified
//     user.isVerified = true;
//     user.verificationToken = undefined;
//     await user.save({ session });

//     // Generate meal plan using AI service
//     const mealPlanData = await sendUserDataToAI({
//       tribe: user.tribe,
//       state: user.state,
//       age: user.age,
//       gender: user.gender,
//       duration: user.duration,
//       dislikedMeals: user.dislikedMeals
//     });

//     // Save the meal plan in the MealPlan table
//     const mealPlan = new MealPlan({
//       userId: user._id,
//       duration: user.duration,
//       plan: mealPlanData
//     });
//     await mealPlan.save({ session });

//     // Generate authentication token
//     const authToken = auth.generateAuthToken(user);

//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json({
//       message: 'Email verified successfully',
//       mealPlan: mealPlanData,
//       token: authToken,
//       userData: user
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error('Error verifying email:', error);
//     if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
//       return res.status(503).json({ error: 'Database operation timed out. Please try again later.' });
//     }
//     res.status(500).json({ error: 'Failed to verify email' });
//   }
// };

// // Register User
// const register = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { fullName, email, weight, height, age, dietaryNeeds, dislikedMeals, duration, tribe, state, gender } = req.body;

//     // Validate if all required fields are present
//     if (!fullName || !email || !weight || !height || !age || !dietaryNeeds || !duration || !tribe || !state || !gender) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ error: 'All fields are required' });
//     }

//     let user = await User.findOne({ email }).session(session);

//     if (!user) {
//       // Create a new user and send verification email
//       const verificationToken = crypto.randomBytes(32).toString('hex');
//       user = new User({
//         fullName,
//         email,
//         weight,
//         height,
//         age,
//         dietaryNeeds,
//         dislikedMeals,
//         duration,
//         tribe,
//         state,
//         gender,
//         verificationToken,
//       });
//       await user.save({ session });

//       console.log(`Verification token for ${email}: ${verificationToken}`);
//       await sendVerificationEmail(user, verificationToken);

//       await session.commitTransaction();
//       session.endSession();
//       return res.status(200).json({ message: 'Please verify your email to complete registration.' });
//     }

//     if (!user.isVerified) {
//       // If the email is not verified, resend the verification email
//       const verificationToken = crypto.randomBytes(32).toString('hex');
//       user.verificationToken = verificationToken;
//       await user.save({ session });
//       await sendVerificationEmail(user, verificationToken);

//       await session.commitTransaction();
//       session.endSession();
//       return res.status(200).json({ message: 'A new verification email has been sent to your email address.' });
//     }

//     // If already verified, generate meal plan and save it in the MealPlan table
//     const mealPlanData = await sendUserDataToAI({
//       tribe: user.tribe,
//       state: user.state,
//       age: user.age,
//       gender: user.gender,
//       duration: user.duration,
//       dislikedMeals: user.dislikedMeals
//     });

//     const mealPlan = new MealPlan({
//       userId: user._id,
//       duration: user.duration,
//       plan: mealPlanData
//     });
//     await mealPlan.save({ session });

//     const token = auth.generateAuthToken(user);

//     await session.commitTransaction();
//     session.endSession();
//     res.status(200).json({ message: 'Registration successful', mealPlan: mealPlanData, token });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error('Error registering user:', error);
//     if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
//       return res.status(503).json({ error: 'Database operation timed out. Please try again later.' });
//     }
//     res.status(500).json({ error: 'Failed to register user' });
//   }
// };

// // ... (rest of the controller functions remain the same)

// module.exports = { register, verifyEmail, login, googleLogin, googleCallback, editUser };









// const mongoose = require('mongoose');
// const winston = require('winston');
// require('dotenv').config();

// const logger = winston.createLogger({
//   level: 'info',
//   format: winston.format.simple(),
//   transports: [
//     new winston.transports.Console(),
//     new winston.transports.File({ filename: 'error.log', level: 'error' }),
//   ],
// });

// const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';

// const connectDB = async () => {
//   try {
//     await mongoose.connect(uri, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
//       socketTimeoutMS: 45000, // Increase socket timeout
//       maxPoolSize: 10, // Adjust based on your needs
//       minPoolSize: 5,
//       connectTimeoutMS: 30000,
//     });

//     logger.info('MongoDB connected successfully');

//     mongoose.connection.on('error', (err) => {
//       logger.error('MongoDB connection error:', err);
//     });

//     mongoose.connection.on('disconnected', () => {
//       logger.info('MongoDB disconnected');
//     });

//     mongoose.connection.on('reconnected', () => {
//       logger.info('MongoDB reconnected');
//     });

//   } catch (error) {
//     logger.error('MongoDB connection error:', error);
//     process.exit(1);
//   }
// };

// const closeConnection = async () => {
//   try {
//     await mongoose.connection.close();
//     logger.info('MongoDB connection closed');
//   } catch (err) {
//     logger.error('Error closing MongoDB connection:', err);
//   }
// };

// const checkDatabaseHealth = async () => {
//   try {
//     await mongoose.connection.db.admin().ping();
//     return true;
//   } catch (error) {
//     logger.error('Database health check failed:', error);
//     return false;
//   }
// };

// module.exports = { connectDB, closeConnection, checkDatabaseHealth };












// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const dropUserCollection = async () => {
//   try {
//     await mongoose.connection.collections['users'].drop();
//     console.log('User collection dropped successfully');
//   } catch (error) {
//     console.error('Error dropping User collection:', error.message);
//   }
// };

// // Define the schema
// const userSchema = new Schema({
//   fullName: { type: String, index: true },
//   email: { type: String, required: true, unique: true, index: true },
//   profilePicture: { type: String, default: '/images/default-img.jpg' },
//   weight: { type: Number },
//   height: { type: Number },
//   age: { type: Number, index: true },
//   dietaryNeeds: { type: String },
//   duration: { type: String, enum: ['one week', 'two weeks'], required: true },
//   dislikedMeals: { type: String },
//   tribe: { type: String, index: true },
//   state: { type: String, index: true },
//   gender: { type: String, enum: ['male', 'female', 'other'], index: true },
//   mealPlan: { type: Object },
//   isVerified: { type: Boolean, default: false, index: true },
//   verificationToken: { type: String },
//   freeMealPlans: { type: Number, default: 2 },
// }, { timestamps: true });

// // Compound indexes
// userSchema.index({ age: 1, state: 1 });
// userSchema.index({ tribe: 1, state: 1 });

// const User = mongoose.model('User', userSchema);

// module.exports = { User, dropUserCollection };