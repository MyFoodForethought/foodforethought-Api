const User = require('../models/user');
const MealPlan = require('../models/mealPlan');
const { sendUserDataToAI } = require('../services/aiServices');



// Function to generate regular meal plans
const generateRegularMealPlan = async (req, res) => {
  const { duration, dislikedMeals } = req.body;

  try {
    // Check if the user is authenticated
    if (!req.user) {
      return res.status(400).json({ error: 'User information is required.' });
    }

    // Find the user based on the provided user ID from the token
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Handle Regular Meal Plan (with free plan tracking)
    if (user.freeMealPlans > 0) {
      user.freeMealPlans -= 1; // Decrement the free meal plan count
      await user.save(); // Save the updated user record

      // Send details to AI service
      const aiResponse = await sendUserDataToAI({
        duration,
        type: 'regular',
        dislikedMeals: dislikedMeals || [],
        location: req.body.location, // Include location if available
      });

      // Create a new meal plan document
      const mealPlan = new MealPlan({
        userId: user._id, // Associate meal plan with the user
        duration,
        type: 'regular',
        plan: aiResponse,
      });
      await mealPlan.save();

      return res.json(mealPlan); // Respond with the generated meal plan
    } else {
      return res.status(403).json({ error: 'Sign up required to generate more meal plans' });
    }
  } catch (error) {
    console.error('Error generating regular meal plan:', error);
    res.status(500).json({ error: 'Failed to generate meal plan' });
  }
};


// Function to generate weight-loss and muscle-gain meal plans
const generateSpecializedMealPlan = async (req, res) => {
  const { duration, type, weight, height, age, dietaryNeeds, dislikedMeals, fullName, email } = req.body;

  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(400).json({ error: 'User information is required.' });
    }

    // Find the user based on the provided user ID from the token
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Update user details if they are not already set
    user.fullName = user.fullName || fullName;
    user.email = user.email || email;
    user.weight = user.weight || weight;
    user.height = user.height || height;
    user.age = user.age || age;
    user.dietaryNeeds = user.dietaryNeeds || dietaryNeeds;
    if (dislikedMeals && !user.dislikedMeals) user.dislikedMeals = dislikedMeals;
    await user.save();

    // Send user details to AI service for meal plan generation
    const aiResponse = await sendUserDataToAI({
      duration,
      type,
      userId: user._id,
      weight,
      height,
      age,
      dietaryNeeds,
      dislikedMeals: dislikedMeals || [],
    });

    // Create a new meal plan document
    const mealPlan = new MealPlan({
      userId: user._id,
      duration,
      type,
      plan: aiResponse,
    });
    await mealPlan.save();

    // Generate an authentication token after saving the meal plan
    const token = auth.generateAuthToken(user);

    // Respond with the generated meal plan and the token
    res.json({ mealPlan, token });
  } catch (error) {
    console.error('Error generating specialized meal plan:', error);
    res.status(500).json({ error: 'Failed to generate meal plan' });
  }
};

// Function to retrieve past meal plans
const getPastMealPlans = async (req, res) => {
  try {
    const mealPlans = await MealPlan.find({ userId: req.user._id });
    res.json(mealPlans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve meal plans' });
  }
};


module.exports = { generateRegularMealPlan, generateSpecializedMealPlan, getPastMealPlans };

