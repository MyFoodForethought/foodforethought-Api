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
        dislikedMeals: user.dislikedMeals, // Ensure dislikedMeals is correctly passed
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
        userData: user
      });
    } catch (error) {
      console.error('Error verifying email:', error);
      res.status(500).json({ error: 'Failed to verify email' });
    }
  };
  