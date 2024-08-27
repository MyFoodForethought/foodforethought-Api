  const mongoose = require('mongoose');

  const mealPlanSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    duration: { type: String, required: true },
    type: { type: String, required: true },
    plan: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  });

  const MealPlan = mongoose.model('MealPlan', mealPlanSchema);
  module.exports = { MealPlan };
