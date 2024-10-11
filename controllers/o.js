const { sendMealPlanNotification } = require('../services/emailService'); // Adjust path as needed

const generateMealPlan = async (req, res) => {
  const { duration, dislikedMeals, age, gender, tribe, state } = req.body;

  try {
    let user = null;

    // Extract the token from the Authorization header
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    
    if (token) {
      try {
        // Verify and decode the token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userEmail = decoded.email;

        // Find the user in the database
        user = await User.findOne({ email: userEmail });
        
        if (user) {
          // Check if we need to update user details
          const updates = {};
          if (!user.age && age) updates.age = age;
          if (!user.gender && gender) updates.gender = gender;
          if (!user.tribe && tribe) updates.tribe = tribe;
          if (!user.state && state) updates.state = state;
          if (!user.dislikedMeals && dislikedMeals) updates.dislikedMeals = dislikedMeals;
          if (!user.duration && duration) updates.duration = duration;

          // Update user details if any changes are required
          if (Object.keys(updates).length > 0) {
            user = await User.findOneAndUpdate(
              { email: userEmail },
              { $set: updates },
              { new: true } // Return the updated user
            );
          }

          // Prepare data for AI service
          const aiResponse = await sendUserDataToAI({
            tribe: user.tribe || tribe,
            state: user.state || state,
            age: user.age || age,
            gender: user.gender || gender,
            dislikedMeals: user.dislikedMeals || dislikedMeals,
            duration: user.duration || duration,
          });

          // Save the generated meal plan to the MealPlan table
          const mealPlan = new MealPlan({
            userId: user._id, // Link meal plan to authenticated user
            duration,
            plan: aiResponse,
          });
          await mealPlan.save();

          // Send meal plan notification email
          await sendMealPlanNotification(user);

          // Return the meal plan and re-send the token (optional)
          return res.status(200).json({ mealPlan, token });
        }
      } catch (err) {
        // Token verification failed
        console.error('Token verification error:', err);
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    }

    // Handle non-authenticated users: proceed with the free meal plan logic
    const ip = req.ip; // Use IP to track non-authenticated users
    const sessionMealPlans = req.session.mealPlans || 0;

    if (sessionMealPlans >= 2) { // Limit to 2 free trials
      return res.status(403).json({ error: 'Sign up required to generate more meal plans' });
    }

    // Increment the session meal plan count for the free user
    req.session.mealPlans = sessionMealPlans + 1;

    // Generate meal plan for non-authenticated user using provided data
    const aiResponse = await sendUserDataToAI({
      tribe,
      state,
      age,
      gender,
      dislikedMeals,
      duration,
    });

    // Save the generated meal plan without a user association
    const mealPlan = new MealPlan({
      userId: null, // No user associated for non-authenticated users
      duration,
      plan: aiResponse,
    });
    await mealPlan.save();

    // Return the generated meal plan for the non-authenticated user
    return res.status(200).json({ mealPlan });
  } catch (error) {
    console.error('Error generating meal plan:', error);
    return res.status(500).json({ error: 'Failed to generate meal plan' });
  }
};
