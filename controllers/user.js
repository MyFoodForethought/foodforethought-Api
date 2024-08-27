const { User } = require('../models/user');
const { Auth } = require('../middleware/auth');
const { sendVerificationEmail } = require('../services/emailService');
const { sendUserDataToAI } = require('../services/aiServices');
const passport = require('passport');
const crypto = require('crypto');

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

    // Log user details before sending to AI service
    console.log('User details at verification:', {
      tribe: user.tribe,
      state: user.state,
      age: user.age,
      gender: user.gender,
      duration: user.duration
    });

    // Generate meal plans
    const mealPlan = await sendUserDataToAI({
      tribe: user.tribe,
      state: user.state,
      age: user.age,
      gender: user.gender,
      duration: user.duration
    });

    user.mealPlan = mealPlan;
    await user.save();

    // Generate authentication token
    const authToken = auth.generateAuthToken(user);

    res.status(200).json({
      message: 'Email verified successfully',
      mealPlan,
      token: authToken
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
};

// Register User
const register = async (req, res) => {
  try {
    const { fullName, email, weight, height, age, dietaryNeeds, duration, type, tribe, state, gender } = req.body;
    console.log('Received registration data:', {
      fullName, email, weight, height, age, dietaryNeeds, duration, type, tribe, state, gender
    });

    // Validate if all required fields are present
    if (!fullName || !email || !weight || !height || !age || !dietaryNeeds || !duration || !type || !tribe || !state || !gender) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    let user = await User.findOne({ email });
    console.log('Retrieved user:', user);
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
        duration,
        type,
        tribe,
        state,
        gender,
        verificationToken,
      });
      await user.save();
      console.log(`Verification token for ${email}: ${verificationToken}`);
      
      await sendVerificationEmail(user, verificationToken);
      return res.status(200).json({ message: 'Please verify your email to complete registration.' });
    }

    if (!user.isVerified) {
      // If the email is not verified, resend the verification email
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.verificationToken = verificationToken;
      await user.save();
      await sendVerificationEmail(user, verificationToken);
      return res.status(200).json({ message: 'A new verification email has been sent to your email address.' });
    }

    // Log user details before sending to AI service
    console.log('User details:', {
      tribe: user.tribe,
      state: user.state,
      age: user.age,
      gender: user.gender,
      duration: user.duration
    });

    // If already verified, generate meal plan and return token
    const mealPlan = await sendUserDataToAI({
      tribe: user.tribe,
      state: user.state,
      age: user.age,
      gender: user.gender,
      duration: user.duration
    });

    user.mealPlan = mealPlan;
    await user.save();
    

    const token = auth.generateAuthToken(user);
    res.status(200).json({ message: 'Registration successful', mealPlan, token });
    
  } catch (error) {
    console.error('Error registering user:', error);
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

    const token = auth.generateAuthToken(user);
    res.status(200).json({ token, user });
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

      const token = auth.generateAuthToken(user);
      res.status(200).json({ token, user });
    } catch (error) {
      console.error('Error during Google login:', error);
      res.status(500).json({ error: 'Failed to process Google login' });
    }
  })(req, res);
};
module.exports = { register, verifyEmail, login, googleLogin, googleCallback };
