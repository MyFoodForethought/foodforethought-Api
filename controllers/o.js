// Function to edit a meal plan by mealPlanId
const editMealPlanById = async (req, res) => {
  const { mealPlanId } = req.params;
  const { duration, plan, userId, createdAt } = req.body; // Include all relevant fields

  try {
    // Validate that the mealPlanId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(mealPlanId)) {
      return res.status(400).json({ error: 'Invalid meal plan ID format' });
    }

    // Prepare the updates object, only updating the fields that are provided
    const updates = {};
    if (duration !== undefined) updates.duration = duration;
    if (plan !== undefined) updates.plan = plan;
    if (userId !== undefined) updates.userId = userId; // Allow updating userId if needed
    if (createdAt !== undefined) updates.createdAt = createdAt; // Allow updating createdAt if needed

    // Check if any fields are being updated
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No details provided to update' });
    }

    // Attempt to find and update the meal plan by its ID
    const updatedMealPlan = await MealPlan.findByIdAndUpdate(
      mealPlanId,
      { $set: updates },
      { new: true } // Return the updated document
    );

    // If no meal plan is found, return a 404 error
    if (!updatedMealPlan) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }

    // Return the updated meal plan
    return res.status(200).json({ message: 'Meal plan updated successfully', mealPlan: updatedMealPlan });
  } catch (error) {
    console.error('Error updating meal plan by ID:', error);
    return res.status(500).json({ error: 'Failed to update meal plan' });
  }
};

module.exports = { 
  generateMealPlan, 
  getPastMealPlans, 
  getMealPlanById, 
  deleteMealPlanById, 
  editUserMealDetails,
  editMealPlanById // Export the new function
};
