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
        user = new User({
          email,
          fullName: displayName,
          profilePicture,
          isVerified: true
        });
        await user.save();
      } else {
        user.profilePicture = profilePicture;
        await user.save();
      }

      // Generate the JWT token
      const token = auth.generateAuthToken(user);

      // Create a base64 encoded string of essential user data including disliked meals
      const userData = Buffer.from(JSON.stringify({
        fullName: user.fullName,
        email: user.email,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified,
        hasDetails: !!(user.age && user.gender && user.tribe && user.state),
        dislikedMeals: user.dislikedMeals || [], // Include disliked meals
        age: user.age || null,
        gender: user.gender || null,
        tribe: user.tribe || null,
        state: user.state || null,
        duration: user.duration || null
      })).toString('base64');

      const redirectUrl = `https://foodforethougt-frontend.onrender.com/auth/success?token=${token}&id=${user._id}&email=${encodeURIComponent(user.email)}&userData=${userData}`;
    
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
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid token or user not found.' });
    }

    const authtoken = auth.generateAuthToken(user);

    // Create a base64 encoded string of essential user data including disliked meals
    const userData = Buffer.from(JSON.stringify({
      fullName: user.fullName,
      email: user.email,
      profilePicture: user.profilePicture,
      isVerified: user.isVerified,
      hasDetails: !!(user.age && user.gender && user.tribe && user.state),
      dislikedMeals: user.dislikedMeals || [], // Include disliked meals
      age: user.age || null,
      gender: user.gender || null,
      tribe: user.tribe || null,
      state: user.state || null,
      duration: user.duration || null
    })).toString('base64');

    const redirectUrl = `https://foodforethougt-frontend.onrender.com/auth/success?token=${authtoken}&id=${user._id}&email=${encodeURIComponent(user.email)}&userData=${userData}`;
    
    return res.redirect(redirectUrl);

  } catch (error) {
    console.error('Token verification failed:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired, please request a new one.' });
    }
    return res.status(400).json({ message: 'Invalid or expired verification token.' });
  }
};