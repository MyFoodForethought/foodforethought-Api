
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mealPlanSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  duration: { type: String, enum: ['one week', 'two weeks'], required: true },
  plan: { type: Object, required: true }, // Storing the meal plan as a JSON object
  createdAt: { type: Date, default: Date.now },
});

const MealPlan = mongoose.model('MealPlan', mealPlanSchema);
module.exports = MealPlan;

