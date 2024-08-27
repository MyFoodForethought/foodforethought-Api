const passport = require('passport');
const { User } = require('../models/user');
const { Auth } = require('../middleware/auth');

const auth = new Auth();

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

module.exports = {
  googleLogin,
  googleCallback,
};
