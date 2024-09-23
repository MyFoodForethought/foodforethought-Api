const verifyEmail = async (req, res) => {
  let session;
  console.log('Starting email verification process');
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    console.log('Transaction started');

    const { token } = req.query;
    console.log(`Received token: ${token}`);

    if (!token) {
      console.log('No token provided');
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'No token provided' });
    }

    const user = await User.findOne({ verificationToken: token, isVerified: false }).session(session);
    console.log(`User found: ${user ? user._id : 'No user found'}`);

    if (!user) {
      console.log('Invalid token or already verified');
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Invalid token or already verified' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    console.log('Updating user verification status');

    try {
      await user.save({ session });
      console.log('User saved successfully');
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      throw saveError;
    }

    let mealPlanData;
    try {
      console.log('Sending user data to AI');
      mealPlanData = await sendUserDataToAI({
        tribe: user.tribe,
        state: user.state,
        age: user.age,
        gender: user.gender,
        duration: user.duration,
        dislikedMeals: user.dislikedMeals
      });
      console.log('Received meal plan data from AI');
    } catch (aiError) {
      console.error('Error getting meal plan from AI:', aiError);
      throw aiError; // Propagate the error to be caught in the main try-catch block
    }

    const mealPlan = new MealPlan({
      userId: user._id,
      duration: user.duration,
      plan: mealPlanData
    });

    console.log('Saving meal plan');
    try {
      await mealPlan.save({ session });
      console.log('Meal plan saved successfully');
    } catch (mealPlanError) {
      console.error('Error saving meal plan:', mealPlanError);
      throw mealPlanError;
    }

    console.log('Generating auth token');
    const authToken = auth.generateAuthToken(user);

    await session.commitTransaction();
    session.endSession();
    console.log('Transaction committed successfully');

    console.log('Sending successful response');
    res.status(200).json({
      message: 'Email verified successfully',
      mealPlan: mealPlanData,
      token: authToken,
      userData: user
    });
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




const register = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log('Starting user registration process');
    const { fullName, email, weight, height, age, dietaryNeeds, dislikedMeals, duration, tribe, state, gender } = req.body;

    console.log('Validating required fields');
    if (!fullName || !email || !weight || !height || !age || !dietaryNeeds || !duration || !tribe || !state || !gender) {
      console.log('Missing required fields');
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'All fields are required' });
    }

    console.log(`Checking if user with email ${email} already exists`);
    let user = await User.findOne({ email }).session(session);

    if (!user) {
      console.log('Creating new user');
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
      
      console.log('Sending verification email');
      await sendVerificationEmail(user, verificationToken);

      await session.commitTransaction();
      session.endSession();
      console.log('Registration successful, verification email sent');
      return res.status(200).json({ message: 'Please verify your email to complete registration.' });
    }

    if (!user.isVerified) {
      console.log('User exists but not verified, resending verification email');
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.verificationToken = verificationToken;
      await user.save({ session });
      await sendVerificationEmail(user, verificationToken);

      await session.commitTransaction();
      session.endSession();
      console.log('New verification email sent');
      return res.status(200).json({ message: 'A new verification email has been sent to your email address.' });
    }

    console.log('User already verified, generating meal plan');
    const mealPlanData = await sendUserDataToAI({
      tribe: user.tribe,
      state: user.state,
      age: user.age,
      gender: user.gender,
      duration: user.duration,
      dislikedMeals: user.dislikedMeals
    });

    console.log('Saving meal plan');
    const mealPlan = new MealPlan({
      userId: user._id,
      duration: user.duration,
      plan: mealPlanData
    });
    await mealPlan.save({ session });

    console.log('Generating auth token');
    const token = auth.generateAuthToken(user);

    await session.commitTransaction();
    session.endSession();
    console.log('Registration process completed successfully');
    res.status(200).json({ message: 'Registration successful', mealPlan: mealPlanData, token });
  } catch (error) {
    console.error('Error in user registration:', error);
    await session.abortTransaction();
    session.endSession();
    
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      console.log('Database operation timed out');
      return res.status(503).json({ error: 'Database operation timed out. Please try again later.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error', details: error.message });
    }
    res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
};