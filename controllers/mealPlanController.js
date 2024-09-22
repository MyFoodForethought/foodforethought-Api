const {User} = require('../models/user');
const {MealPlan} = require('../models/mealPlan');
const { sendUserDataToAI } = require('../services/aiServices');
const { Auth } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const auth = new Auth();

// Function to generate meal plans based on new flow
const generateMealPlan = async (req, res) => {
  const { duration, dislikedMeals, age, gender, tribe, state } = req.body;

  try {
    let user = null;

    // Extract the token from the Authorization header
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

    if (token) {
      try {
        // Verify and decode the token (safe decoding with verification)
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userEmail = decoded.email;

        // Check if user exists
        user = await User.findOne({ email: userEmail });

        if (user) {
          // User is authenticated, proceed with generating meal plan using stored user data
          const aiResponse = await sendUserDataToAI({
            tribe: user.tribe,      // Use stored or provided data
            state: user.state,
            age: user.age,
            gender: user.gender,
            dislikedMeals: user.dislikedMeals,
            duration:user.duration,
          });

          // Save the generated meal plan to the MealPlan table
          const mealPlan = new MealPlan({
            userId: user._id, // Link meal plan to authenticated user
            duration:user.duration,
            plan: aiResponse,
          });
          await mealPlan.save();

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


// Function to retrieve past meal plans
const getPastMealPlans = async (req, res) => {
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

    // Retrieve meal plans using the user's _id
    const mealPlans = await MealPlan.find({ userId: user._id });
    res.json(mealPlans);
  } catch (error) {
    console.error('Error retrieving past meal plans:', error);
    res.status(500).json({ error: 'Failed to retrieve meal plans' });
  }
};



module.exports = { generateMealPlan, getPastMealPlans };
