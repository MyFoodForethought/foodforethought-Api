
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dropMealCollection = async () => {
  try {
    await MealPlan.collection.drop();
    console.log('mEAL-PLAN collection dropped successfully');
  } catch (error) {
    console.error('Error dropping mEal-PlaN collection:', error.message);
  }
};

const mealPlanSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  duration: { type: String, enum: ['one week', 'two weeks'], required: true },
  plan: { type: Object, required: true }, // Storing the meal plan as a JSON object
  createdAt: { type: Date, default: Date.now },
});

const MealPlan = mongoose.model('MealPlan', mealPlanSchema);
// module.exports = MealPlan;
module.exports = { MealPlan, dropMealCollection };

