const mongoose = require('mongoose');
const { MealPlan } = require('../models/mealPlan');

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

module.exports = { deleteMealPlanById };
