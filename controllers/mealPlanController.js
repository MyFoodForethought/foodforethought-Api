const {User} = require('../models/user');
const {MealPlan} = require('../models/mealPlan');
const { sendMealPlanNotification } = require('../services/emailService');
const { sendUserDataToAI } = require('../services/aiServices');
const { Auth } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); 

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

          // Use either the updated data or the provided values
          const userTribe = user.tribe || tribe;
          const userState = user.state || state;
          const userAge = user.age || age;
          const userGender = user.gender || gender;
          const userDislikedMeals = user.dislikedMeals || dislikedMeals;
          const userDuration = user.duration || duration;

          // Send data to AI service
          const aiResponse = await sendUserDataToAI({
            tribe: userTribe,
            state: userState,
            age: userAge,
            gender: userGender,
            dislikedMeals: userDislikedMeals,
            duration: userDuration,
          });

          // Save the generated meal plan to the MealPlan table
          const mealPlan = new MealPlan({
            userId: user._id, // Link meal plan to authenticated user
            duration: userDuration,
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



const getMealPlanById = async (req, res) => {
  try {
    // Get mealPlanId from the request parameters
    const { mealPlanId } = req.params;

    // Find the meal plan in the database using the mealPlanId
    const mealPlan = await MealPlan.findById(mealPlanId);

    // If no meal plan is found, return a 404 error
    if (!mealPlan) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }

    // Return the found meal plan
    return res.status(200).json({ mealPlan });
  } catch (error) {
    console.error('Error retrieving meal plan by ID:', error);
    return res.status(500).json({ error: 'Failed to retrieve meal plan' });
  }
};

// Function to delete a meal plan by mealPlanId
const deleteMealPlanById = async (req, res) => {
  try {
    const { mealPlanId } = req.params;

    // Validate that the mealPlanId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(mealPlanId)) {
      return res.status(400).json({ error: 'Invalid meal plan ID format' });
    }

    // Attempt to find and delete the meal plan by its ID
    const mealPlan = await MealPlan.findByIdAndDelete(mealPlanId);

    // If no meal plan is found, return a 404 error
    if (!mealPlan) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }

    // Return success response if the meal plan was deleted
    return res.status(200).json({ message: 'Meal plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting meal plan by ID:', error);
    return res.status(500).json({ error: 'Failed to delete meal plan' });
  }
};



module.exports = { generateMealPlan, getPastMealPlans, getMealPlanById, deleteMealPlanById };
