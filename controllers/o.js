const verifyEmail = async (req, res) => {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const { token } = req.query;

    // Log the token to verify its presence and structure
    console.log("Received Token: ", token);

    if (!token) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'No token provided' });
    }

    // Attempt to verify the token
    let decoded;
    try {
      decoded = auth.verifyAuthToken(token); // Ensure this is properly implemented
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Find the user with the decoded ID and check if they're unverified
    const user = await User.findOne({ _id: decoded.id, isVerified: false }).session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Invalid token or user already verified' });
    }

    // Mark the user as verified and clear the verification token
    user.isVerified = true;
    user.verificationToken = undefined;

    await user.save({ session });

    // Generate meal plan (if necessary) and issue new JWT token
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

    // Generate auth token for the user
    const authToken = auth.generateAuthToken(user);

    await session.commitTransaction();
    session.endSession();

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

    res.status(500).json({ error: 'Failed to verify email', details: error.message });
  }
};
