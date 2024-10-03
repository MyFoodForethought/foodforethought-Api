const verifyEmail = async (req, res) => {
  let session;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const token = req.query.token.trim(); // Trim incoming token
    console.log("Incoming Token: ", token);

    const user = await User.findOne({ verificationToken: token, isVerified: false }).session(session);
    
    if (!user) {
      console.log("User not found or token mismatch.");
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Invalid token or already verified' });
    }

    console.log("Stored Token for User: ", user.verificationToken); // Log stored token

    // Verify user
    user.isVerified = true;
    user.verificationToken = undefined;

    try {
      await user.save({ session });
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      throw saveError;
    }

    // Send user data to the AI service and get meal plan
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
      console.error('Error sending user data to AI:', aiError);
      throw aiError; // Propagate the error
    }

    // Create and save meal plan in DB
    const mealPlan = new MealPlan({
      userId: user._id,
      duration: user.duration,
      plan: mealPlanData
    });

    try {
      await mealPlan.save({ session });
      console.log('Meal plan saved successfully');
    } catch (mealPlanError) {
      console.error('Error saving meal plan:', mealPlanError);
      throw mealPlanError;
    }

    // Generate auth token
    const auth = new Auth();
    const authToken = auth.generateAuthToken(user);

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Redirect to the frontend success URL, passing the auth token and optionally other details
    const redirectUrl = `https://foodforethougt-frontend.onrender.com/auth/register/success?token=${authToken}&id=${user._id}&email=${encodeURIComponent(user.email)}`;
    
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

    // Handle specific errors
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      console.log('Database operation timed out');
      return res.status(503).json({ error: 'Database operation timed out. Please try again later.' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error', details: error.message });
    }

    console.log('Sending error response');
    res.status(500).json({ error: 'Failed to verify email', details: error.message });
  }
};
