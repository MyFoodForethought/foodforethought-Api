const { User } = require('../models/user');
const MealPlan = require('../models/mealPlan');
const { Auth } = require('../middleware/auth');
const { sendVerificationEmail } = require('../services/emailService');
const { sendUserDataToAI } = require('../services/aiServices');
const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');

const auth = new Auth();

// Verify Email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({ verificationToken: token, isVerified: false });

    if (!user) return res.status(400).json({ error: 'Invalid token or already verified' });

    // Mark the user as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();


    // Generate meal plan using AI service
    const mealPlanData = await sendUserDataToAI({
      tribe: user.tribe,
      state: user.state,
      age: user.age,
      gender: user.gender,
      duration: user.duration,
      dislikedMeals: user.dislikedMeals
    });
    


    // Save the meal plan in the MealPlan table
    const mealPlan = new MealPlan({
      userId: user._id,
      duration: user.duration,
      plan: mealPlanData
    });
    await mealPlan.save();

    // Generate authentication token
    const authToken = auth.generateAuthToken(user);

    res.status(200).json({
      message: 'Email verified successfully',
      mealPlan: mealPlanData,
      token: authToken,
      userData:user
    });
  } catch (error) {
    console.error('Error verifying email:', error);
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

      console.log(`Verification token for ${email}: ${verificationToken}`);
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
    console.error('Error registering user:', error);
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      return res.status(503).json({ error: 'Database operation timed out. Please try again later.' });
    }
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// Login User
const login = async (req, res) => {
  try {
    const { email, fullName } = req.body;
    let user = await User.findOne({ email });

    if (!user) {
      // If user doesn't exist, create and send verification email
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user = new User({ email, fullName, verificationToken });
      await user.save();
      await sendVerificationEmail(user, verificationToken);
      return res.status(200).json({ message: 'Please check your email to verify your account.' });
    }

    if (!user.isVerified) return res.status(400).json({ error: 'Email not verified' });

    // Fetch the most recent meal plan
    const mealPlan = await MealPlan.findOne({ userId: user._id }).sort({ createdAt: -1 });

    const token = auth.generateAuthToken(user);
    res.status(200).json({ token, user, mealPlan });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Failed to log in user' });
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
      const displayName = googleUser.fullName || '';
      const profilePicture = googleUser.profilePicture || null;

      if (!email) {
        console.error('Unable to retrieve email from Google profile');
        return res.status(400).json({ error: 'Unable to retrieve email from Google profile' });
      }

      let user = await User.findOne({ email });

      if (!user) {
        user = new User({
          email,
          fullName: displayName,
          profilePicture,
          isVerified: true,
        });
      } else {
        user.profilePicture = profilePicture;
      }

      await user.save();
      console.log(`User logged in with Google: ${email}`);

      // Fetch the most recent meal plan
      const mealPlan = await MealPlan.findOne({ userId: user._id }).sort({ createdAt: -1 });

      const token = auth.generateAuthToken(user);
      res.status(200).json({ token, user, mealPlan });
    } catch (error) {
      console.error('Error during Google login:', error);
      res.status(500).json({ error: 'Failed to process Google login' });
    }
  })(req, res);
};

const editUser = async (req, res) => {
  try {
    // Use the email from the decoded token to find the user
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = req.body;

    // Validate input data
    const validFields = [
      'fullName',
      'weight',
      'height',
      'age',
      'dietaryNeeds',
      'dislikedMeals',
      'duration',
      'tribe',
      'state',
      'gender'
    ];

    // Filter the updateData to include only valid fields
    const filteredUpdateData = Object.keys(updateData).reduce((acc, key) => {
      if (validFields.includes(key)) {
        acc[key] = updateData[key];
      }
      return acc;
    }, {});

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: filteredUpdateData },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found after update' });
    }

    res.status(200).json({
      message: 'User details updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user details:', error);
    res.status(500).json({ error: 'Failed to update user details' });
  }
};


module.exports = { register, verifyEmail, login, googleLogin, googleCallback, editUser };
