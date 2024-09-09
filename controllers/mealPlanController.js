const {User} = require('../models/user');
const MealPlan = require('../models/mealPlan');
const { sendUserDataToAI } = require('../services/aiServices');
const { Auth } = require('../middleware/auth');

const auth = new Auth();

// Function to generate meal plans based on new flow
const generateMealPlan = async (req, res) => {
  const { duration, dislikedMeals, age, gender, tribe, state } = req.body;

  try {
    if (req.user) {
      // If the user is authenticated, track their free meal plans
      const user = await User.findById(req.user._id);

      if (user.freeMealPlans <= 0) {
        return res.status(403).json({ error: 'Sign up required to generate more meal plans' });
      }

      // Decrement the freeMealPlans count
      user.freeMealPlans -= 1;
      await user.save();
    } else {
      // Track the number of free meal plans for non-authenticated users
      const ip = req.ip; // Use IP to track non-authenticated users
      const sessionMealPlans = req.session.mealPlans || 0;

      if (sessionMealPlans >= 2) { // Updated limit to 2 trials
        return res.status(403).json({ error: 'Sign up required to generate more meal plans' });
      }

      req.session.mealPlans = sessionMealPlans + 1;
    }

    // Send user details to the AI service for meal plan generation
    const aiResponse = await sendUserDataToAI({
      duration,
      dislikedMeals,
      age,
      gender,
      tribe,
      state,
    });

    // Create a new meal plan document
    const mealPlan = new MealPlan({
      userId: req.user ? req.user._id : null, // Associate meal plan with the user if authenticated
      duration,
      plan: aiResponse,
    });

    await mealPlan.save();

    // Generate an authentication token if the user is authenticated
    const token = req.user ? auth.generateAuthToken(req.user) : null;

    // Respond with the generated meal plan and the token if available
    res.json({ mealPlan, token });
  } catch (error) {
    console.error('Error generating meal plan:', error);
    res.status(500).json({ error: 'Failed to generate meal plan' });
  }
};


// Function to retrieve past meal plans
const getPastMealPlans = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Find the user by email
    const user = await User.findOne({ email: req.user.email });

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
