const verifyEmail = async (req, res) => {
    console.log('Entering verifyEmail function');
    let session;
    try {
      console.log('Starting MongoDB session');
      session = await mongoose.startSession();
      session.startTransaction();
  
      console.log('Starting email verification process');
  
      // Log the request query for debugging
      console.log('Incoming request query:', req.query);
  
      const { token } = req.query;
  
      // Log the token received
      console.log(`Received token: ${token}`);
  
      if (!token) {
        console.log('No token provided');
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: 'No token provided' });
      }
  
      // Log that we're looking for the user
      console.log('Searching for user with token and unverified status...');
      const user = await User.findOne({ verificationToken: token, isVerified: false }).session(session);
  
      // Log the result of the user search
      console.log('User found:', user);
  
      if (!user) {
        console.log('Invalid token or user already verified');
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: 'Invalid token or already verified' });
      }
  
      console.log('Updating user verification status');
      user.isVerified = true;
      user.verificationToken = undefined;
  
      // Log the user before saving to ensure the fields are correctly updated
      console.log('User before saving:', user);
      await user.save({ session });
      console.log('User verification status updated successfully');
  
      // Generate meal plan
      console.log('Generating meal plan...');
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
        // Log the meal plan data returned from AI
        console.log('Meal plan data from AI:', mealPlanData);
      } catch (aiError) {
        console.error('Error generating meal plan:', aiError);
        mealPlanData = null; // Handle AI error with a default plan or null
      }
  
      console.log('Saving meal plan...');
      const mealPlan = new MealPlan({
        userId: user._id,
        duration: user.duration,
        plan: mealPlanData
      });
  
      // Log the meal plan before saving
      console.log('Meal plan to be saved:', mealPlan);
      await mealPlan.save({ session });
      console.log('Meal plan saved successfully');
  
      // Generate authentication token
      console.log('Generating authentication token...');
      const authToken = auth.generateAuthToken(user);
  
      // Log the generated token
      console.log('Auth token generated:', authToken);
  
      // Commit the transaction
      console.log('Committing transaction...');
      await session.commitTransaction();
      session.endSession();
      console.log('Transaction committed successfully and session ended');
  
      // Send the successful response
      res.status(200).json({
        message: 'Email verified successfully',
        mealPlan: mealPlanData,
        token: authToken,
        userData: user
      });
    } catch (error) {
      console.error('Error in email verification process:', error);
  
      // Abort the transaction if there's an error
      if (session) {
        console.log('Aborting transaction due to error...');
        await session.abortTransaction().catch(console.error);
        session.endSession();
        console.log('Transaction aborted and session ended');
      }
  
      // Log the full error stack
      console.error('Full error stack:', error.stack);
  
      if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
        return res.status(503).json({ error: 'Database operation timed out. Please try again later.' });
      }
      res.status(500).json({ error: 'Failed to verify email' });
    }
  };