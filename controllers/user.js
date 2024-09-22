const { User } = require('../models/user');
const {MealPlan} = require('../models/mealPlan');
const { Auth } = require('../middleware/auth');
const { sendVerificationEmail, sendLoginVerificationEmail } = require('../services/emailService');
const { sendUserDataToAI } = require('../services/aiServices');
const passport = require('passport');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const auth = new Auth();

// Verify Email
const verifyEmail = async (req, res) => {

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const { token } = req.query;

    if (!token) {
      
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'No token provided' });
    }

    const user = await User.findOne({ verificationToken: token, isVerified: false }).session(session);
    

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Invalid token or already verified' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;

    
    await user.save({ session });
    

   

    let mealPlanData;
    try {
      mealPlanData = await sendUserDataToAI({
        tribe: user.tribe,
        state: user.state,
        age: user.age,
        gender: user.gender,
        duration: user.duration,
        dislikedMeals: user.dislikedMeals
      });
    } catch (aiError) {
      mealPlanData = null; // Handle AI error with a default plan or null
    }

    
    const mealPlan = new MealPlan({
      userId: user._id,
      duration: user.duration,
      plan: mealPlanData
    });

    
    await mealPlan.save({ session });
   

    // Generate authentication token
    
    const authToken = auth.generateAuthToken(user);
   
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Send the successful response
    res.status(200).json({
      message: 'Email verified successfully',
      mealPlan: mealPlanData,
      token: authToken,
      userData: user
    });
  } catch (error) {
   

    // Abort the transaction if there's an error
    if (session) {
      await session.abortTransaction().catch(console.error);
      session.endSession();
    }

  

    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      return res.status(503).json({ error: 'Database operation timed out. Please try again later.' });
    }
    res.status(500).json({ error: 'Failed to verify email' });
  }
};

// Register User
const register = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { fullName, email, weight, height, age, dietaryNeeds, dislikedMeals, duration, tribe, state, gender } = req.body;

    // Validate if all required fields are present
    if (!fullName || !email || !weight || !height || !age || !dietaryNeeds || !duration || !tribe || !state || !gender) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'All fields are required' });
    }

    let user = await User.findOne({ email }).session(session);

    if (!user) {
      // Create a new user and send verification email
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user = new User({
        fullName,
        email,
        weight,
        height,
        age,
        dietaryNeeds,
        dislikedMeals,
        duration,
        tribe,
        state,
        gender,
        verificationToken,
      });
      await user.save({ session });
      
      await sendVerificationEmail(user, verificationToken);

      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ message: 'Please verify your email to complete registration.' });
    }

    if (!user.isVerified) {
      // If the email is not verified, resend the verification email
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.verificationToken = verificationToken;
      await user.save({ session });
      await sendVerificationEmail(user, verificationToken);

      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ message: 'A new verification email has been sent to your email address.' });
    }

    // If already verified, generate meal plan and save it in the MealPlan table
    const mealPlanData = await sendUserDataToAI({
      tribe: user.tribe,
      state: user.state,
      age: user.age,
      gender: user.gender,
      duration: user.duration,
      dislikedMeals: user.dislikedMeals
    });

    const mealPlan = new MealPlan({
      userId: user._id,
      duration: user.duration,
      plan: mealPlanData
    });
    await mealPlan.save({ session });

    const token = auth.generateAuthToken(user);

    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ message: 'Registration successful', mealPlan: mealPlanData, token });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      return res.status(503).json({ error: 'Database operation timed out. Please try again later.' });
    }
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// Login User
const login = async (req, res) => {
  const { email } = req.body;
  
  console.log('Login request received for email:', email);

  try {
      // Find user by email
      const user = await User.findOne({ email });
      
      console.log('User lookup result:', user);

      if (!user) {
          // If user doesn't exist, prompt them to register
          console.log('User does not exist, prompting registration.');
          return res.status(400).json({ message: 'User does not exist. Please register.' });
      }

      // Generate a verification token (JWT or similar)
      const verificationToken = auth.generateAuthToken(user);
      console.log('Generated verification token:', verificationToken);

      // Send the email with the verification link
      await sendLoginVerificationEmail(user, verificationToken);
      console.log('Verification email sent to:', user.email);

      // Inform user to check their email
      return res.status(200).json({ message: 'Verification email sent. Please check your email to log in.' });
  } catch (error) {
      console.error('Error during login process:', error);
      return res.status(500).json({ error: 'Error during login process' });
  }
};





// Google Login
const googleLogin = passport.authenticate('google', { scope: ['profile', 'email'] });

const googleCallback = (req, res) => {
  passport.authenticate('google', async (err, googleUser) => {
    if (err) {
      console.error('Google authentication error:', err);
      return res.status(500).json({ error: 'Failed to authenticate with Google' });
    }

    if (!googleUser) {
      console.error('Google authentication failed: No user returned');
      return res.status(400).json({ error: 'Google authentication failed' });
    }

    try {
      const email = googleUser.email || null;
      const displayName = googleUser.displayName || '';
      const profilePicture = googleUser.photos && googleUser.photos.length > 0 ? googleUser.photos[0].value : null;

      if (!email) {
        console.error('Unable to retrieve email from Google profile');
        return res.status(400).json({ error: 'Unable to retrieve email from Google profile' });
      }

      // Find the user by email
      let user = await User.findOne({ email });

      if (!user) {
        // If user doesn't exist, create a new user in the database
        user = new User({
          email,
          fullName: displayName,
          profilePicture,
          isVerified: true // Automatically mark as verified through Google
        });
        await user.save();
      } else {
        // Update the user's Google profile picture if available
        user.profilePicture = profilePicture;
        await user.save();
      }

      // Fetch the most recent meal plan
      const mealPlan = await MealPlan.findOne({ userId: user._id }).sort({ createdAt: -1 });

      // Generate the JWT token
      const token = auth.generateAuthToken(user);

      console.log(`User logged in with Google: ${email}`);

      // Return user data, token, and past meal plans
      return res.status(200).json({
        token,
        user: {
          email: user.email,
          fullName: user.fullName,
          profilePicture: user.profilePicture
        },
        mealPlan: mealPlan || null // If no meal plan exists, return null
      });
    } catch (error) {
      console.error('Error during Google login:', error);
      return res.status(500).json({ error: 'Failed to process Google login' });
    }
  })(req, res);
};





const verifyLogin = async (req, res) => {
  const { token } = req.query;

  try {
    // Verify the token using JWT and get the decoded payload
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log('Decoded token:', decoded);  // Log decoded payload to debug

    // Now, find the user based on their email in the decoded token
    const user = await User.findOne({ email: decoded.email });
    console.log('Found user:', user);

    if (!user) {
      return res.status(400).json({ message: 'Invalid token or user not found.' });
    }

    // Fetch the user's past meal plans
    const mealPlan = await MealPlan.findOne({ userId: user._id }).sort({ createdAt: -1 });
    const authtoken = auth.generateAuthToken(user);

    // Return the user details and meal plans
    return res.status(200).json({
      authtoken,
      message: 'Login successful',
      user,
      mealPlan,
    });

  } catch (error) {
    console.error('Token verification failed:', error);  // Log the error for debugging
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired, please request a new one.' });
    }
    return res.status(400).json({ message: 'Invalid or expired verification token.' });
  }
};




const editUser = async (req, res) => {
  try {
    
    // The email is now directly in req.user
    const userEmail = req.user;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'No email found in the token' });
    }

    // Find the user by email
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract updatable fields from request body
    const { fullName, weight, height, age, dietaryNeeds, dislikedMeals, duration, tribe, state, gender } = req.body;

    console.log('Fields being updated:', req.body);

    // Update user fields if provided
    if (fullName) user.fullName = fullName;
    if (weight) user.weight = weight;
    if (height) user.height = height;
    if (age) user.age = age;
    if (dietaryNeeds) user.dietaryNeeds = dietaryNeeds;
    if (dislikedMeals) user.dislikedMeals = dislikedMeals;
    if (duration) user.duration = duration;
    if (tribe) user.tribe = tribe;
    if (state) user.state = state;
    if (gender) user.gender = gender;

    // Save the updated user
    await user.save();

    console.log('User updated successfully');

    res.status(200).json({
      message: 'User updated successfully',
      user: {
        fullName: user.fullName,
        email: user.email,
        weight: user.weight,
        height: user.height,
        age: user.age,
        dietaryNeeds: user.dietaryNeeds,
        dislikedMeals: user.dislikedMeals,
        duration: user.duration,
        tribe: user.tribe,
        state: user.state,
        gender: user.gender
      }
    });
  } catch (error) {
    console.error('Error in editUser:', error);
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
};

module.exports = { register, verifyEmail, verifyLogin, login, googleLogin, googleCallback, editUser };
