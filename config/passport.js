const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models/user');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  // callbackURL: 'http://localhost:3000/google/callback',
  callbackURL: 'https://foodforethought-api.onrender.com/google/callback',

  scope: ['profile', 'email'] // Ensure the 'email' scope is included
},
async (accessToken, refreshToken, profile, done) => {
  console.log('Received Google profile:', JSON.stringify(profile, null, 2)); // Log the entire profile

  try {
    // Check if profile.emails exists and is not empty
    if (!profile.emails || profile.emails.length === 0) {
      console.error('No email found in Google profile:', profile);
      return done(new Error('No email found in Google profile'), null);
    }

    const email = profile.emails[0].value;
    console.log('Extracted email from Google profile:', email);

    let user = await User.findOne({ email });
    if (user) {
      console.log('Existing user found:', user);
    } else {
      console.log('No existing user found, creating a new user...');
      user = new User({
        email,
        fullName: profile.displayName,
        profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
        isVerified: true
      });
      await user.save();
      console.log('New user created:', user);
    }

    done(null, user);
  } catch (error) {
    console.error('Error in Google Strategy:', error);
    done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.error('Error in deserializing user:', error);
    done(error, null);
  }
});
