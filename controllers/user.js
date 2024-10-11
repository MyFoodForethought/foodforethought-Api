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

    const token = req.query.token.trim(); // Just trimming whitespace
    console.log("Incoming Token: ", token); // Log incoming token

    const user = await User.findOne({ verificationToken: token, isVerified: false }).session(session);
    
    if (!user) {
      console.log("User not found or token mismatch.");
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Invalid token or already verified' });
    }

    console.log("Stored Token for User: ", user.verificationToken); // Log stored token

    // Proceed to verify the user
    user.isVerified = true;
    user.verificationToken = undefined; // Clear the token

    try {
      await user.save({ session });
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      throw saveError;
    }

    // let mealPlanData;
    // try {
    //   mealPlanData = await sendUserDataToAI({
    //     tribe: user.tribe,
    //     state: user.state,
    //     age: user.age,
    //     gender: user.gender,
    //     duration: user.duration,
    //     dislikedMeals: user.dislikedMeals
    //   });
    // } catch (aiError) {
    //   console.error('Error sending user data to AI:', aiError);
    //   throw aiError; // Propagate the error to be caught in the main try-catch block
    // }

    // const mealPlan = new MealPlan({
    //   userId: user._id,
    //   duration: user.duration,
    //   plan: mealPlanData
    // });

    // try {
    //   await mealPlan.save({ session });
    //   console.log('Meal plan saved successfully');
    // } catch (mealPlanError) {
    //   console.error('Error saving meal plan:', mealPlanError);
    //   throw mealPlanError;
    // }

    const auth = new Auth();
    const authToken = auth.generateAuthToken(user);

    await session.commitTransaction();
    session.endSession();

    // res.status(200).json({
    //   message: 'Email verified successfully',
    //   token: authToken,
    //   userData: user
    // });

    // Redirect to the frontend success URL, passing the auth token and optionally other details
    const redirectUrl = `https://foodforethougt-frontend.onrender.com/auth/success?token=${authToken}&id=${user._id}&email=${encodeURIComponent(user.email)}`;
    
    // Perform the redirection
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in email verification:', error);

    if (session) {
      try {
        await session.abortTransaction();
        console.log('Transaction aborted');
      } catch (abortError) {
        console.error('Error aborting transaction:', abortError);
      }
      session.endSession();
    }

    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      console.log('Database operation timed out');
      return res.status(503).json({ error: 'Database operation timed out. Please try again later.' });
    }

    // More specific error handling
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error', details: error.message });
    }

    console.log('Sending error response');
    res.status(500).json({ error: 'Failed to verify email', details: error.message });
  }
};

// Register User
const register = async (req, res) => {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    console.log('Starting user registration process');
    // const { fullName, email, weight, height, age, dietaryNeeds, dislikedMeals, duration, tribe, state, gender } = req.body;
    const { fullName, email } = req.body;

    console.log(`Checking if user with email ${email} already exists`);
    let user = await User.findOne({ email }).session(session);

    // Initialize the verification token variable in the outer scope to avoid shadowing issues
    let verificationToken;

    if (!user) {
      console.log('Creating new user');
      // Generate a new verification token
      verificationToken = crypto.randomBytes(32).toString('hex');
      
      user = new User({
        fullName,
        email,
        verificationToken,  // Attach the generated token to the new user
      });
      await user.save({ session });
      
      console.log('Sending verification email');
      await sendVerificationEmail(user, verificationToken);  // Pass the token to the email function

      await session.commitTransaction();
      console.log('Registration successful, verification email sent');
      return res.status(200).json({ message: 'Please verify your email to complete registration.', token:verificationToken});
    }

    if (!user.isVerified) {
      console.log('User exists but not verified, resending verification email');
      // Generate a new verification token for existing user
      verificationToken = crypto.randomBytes(32).toString('hex');
      console.log("verification token:", verificationToken)
      
      // Update the user document with the new token
      user.verificationToken = verificationToken;
      await user.save({ session });

      // Resend verification email
      await sendVerificationEmail(user, verificationToken);  // Ensure token is passed correctly here

      await session.commitTransaction();
      console.log('New verification email sent');
      return res.status(200).json({ message: 'A new verification email has been sent to your email address.' });
    }

    // console.log('User already verified, generating meal plan');
    // const mealPlanData = await sendUserDataToAI({
    //   tribe: user.tribe,
    //   state: user.state,
    //   age: user.age,
    //   gender: user.gender,
    //   duration: user.duration,
    //   dislikedMeals: user.dislikedMeals
    // });

    // console.log('Saving meal plan');
    // const mealPlan = new MealPlan({
    //   userId: user._id,
    //   duration: user.duration,
    //   plan: mealPlanData
    // });
    // await mealPlan.save({ session });

    console.log('Generating auth token');
    const token = auth.generateAuthToken(user);

    await session.commitTransaction();
    console.log('Registration process completed successfully');
    res.status(200).json({ message: 'Registration successful', token });
    
  } catch (error) {
    console.error('Error in user registration:', error);

    // Rollback transaction on error
    if (session) {
      await session.abortTransaction();
    }

    // Handle specific error types for more clarity
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      console.log('Database operation timed out');
      return res.status(503).json({ error: 'Database operation timed out. Please try again later.' });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error', details: error.message });
    }
    
    // Generic error handler
    res.status(500).json({ error: 'Failed to register user', details: error.message });
    
  } finally {
    if (session) {
      session.endSession();
    }
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
      return res.status(200).json({ message: 'Verification email sent. Please check your email to log in.' , token:verificationToken});
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
      // return res.status(200).json({
      //   token,
      //   user: {
      //     email: user.email,
      //     fullName: user.fullName,
      //     profilePicture: user.profilePicture
      //   },
      //   mealPlan: mealPlan || null // If no meal plan exists, return null
      // });
      const redirectUrl = `https://foodforethougt-frontend.onrender.com/auth/register/success?token=${token}&id=${user._id}&email=${encodeURIComponent(user.email)}`;
    
      // Perform the redirection
      return res.redirect(redirectUrl);
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
    // const mealPlan = await MealPlan.findOne({ userId: user._id }).sort({ createdAt: -1 });
    const authtoken = auth.generateAuthToken(user);

    // // Return the user details and meal plans
    // return res.status(200).json({
    //   authtoken,
    //   message: 'Login successful',
    //   user,
    //   mealPlan,
    // });

    // Redirect to the frontend success URL, passing the auth token and optionally other details
    const redirectUrl = `https://foodforethougt-frontend.onrender.com/auth/register/success?token=${authtoken}&id=${user._id}&email=${encodeURIComponent(user.email)}`;
    
    // Perform the redirection
    return res.redirect(redirectUrl);

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



const getUserProfile = async (req, res) => {
  try {
    // Extract token from headers
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify and decode the token to get user email
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const email = decoded.email;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Respond with the user data
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error retrieving user profile:', error);
    res.status(500).json({ error: 'Server error retrieving user profile' });
  }
};


const updateDislikedMeals = async (req, res) => {
  try {
    // The email is now directly in req.user
    const userEmail = req.user; // Ensure req.user contains the email extracted from the token
    
    if (!userEmail) {
      return res.status(400).json({ error: 'No email found in the token' });
    }

    // Find the user by email
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract dislikedMeals from request body
    const { dislikedMeals } = req.body;

    if (!dislikedMeals) {
      return res.status(400).json({ error: 'No disliked meals provided' });
    }

    console.log('Updating disliked meals to:', dislikedMeals);

    // Update dislikedMeals field
    user.dislikedMeals = dislikedMeals;

    // Save the updated user
    await user.save();

    console.log('Disliked meals updated successfully');

    res.status(200).json({
      message: 'Disliked meals updated successfully',
      dislikedMeals: user.dislikedMeals // Return the updated disliked meals
    });
  } catch (error) {
    console.error('Error in updateDislikedMeals:', error);
    res.status(500).json({ error: 'Failed to update disliked meals', details: error.message });
  }
};


const deleteAccount = async (req, res) => {
  // Extract the token from the Authorization header
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

  if (token) {
      try {
          // Verify and decode the token
          const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
          const userEmail = decoded.email; // Extract the email

          console.log('Delete account request received for email:', userEmail);

          if (!userEmail) {
              return res.status(400).json({ error: 'Email is required' });
          }

          let session;
          try {
              session = await mongoose.startSession();
              session.startTransaction();

              // Find the user in the database using the extracted email
              const user = await User.findOne({ email: userEmail });

              if (!user) {
                  console.log('User not found for the given email:', userEmail);
                  await session.abortTransaction();
                  return res.status(404).json({ error: 'User not found' });
              }

              // Optionally, delete associated meal plans
              await MealPlan.deleteMany({ userId: user._id }).session(session);

              // Delete the user account
              await User.deleteOne({ email: userEmail }).session(session);

              await session.commitTransaction();
              console.log('User account deleted successfully for email:', userEmail);
              return res.status(200).json({ message: 'Account deleted successfully' });
          } catch (error) {
              console.error('Error deleting account:', error);
              if (session) {
                  await session.abortTransaction();
              }
              return res.status(500).json({ error: 'Failed to delete account', details: error.message });
          } finally {
              if (session) {
                  session.endSession();
              }
          }
      } catch (err) {
          return res.status(401).json({ error: 'Unauthorized', details: err.message });
      }
  } else {
      return res.status(403).json({ error: 'No token provided' });
  }
};

module.exports = { register, verifyEmail, verifyLogin, login, googleLogin, googleCallback, editUser, getUserProfile, updateDislikedMeals, deleteAccount  };
