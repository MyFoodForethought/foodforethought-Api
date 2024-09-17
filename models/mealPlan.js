
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







// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const mealPlanSchema = new Schema({
//   userId: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'User',
//     index: true // Add an index for better query performance
//   },
//   duration: { 
//     type: String, 
//     enum: ['one week', 'two weeks'], 
//     required: [true, 'Duration is required']
//   },
//   plan: { 
//     type: Object, 
//     required: [true, 'Meal plan is required'],
//     validate: {
//       validator: function(v) {
//         // Add any specific validation for your meal plan object structure
//         return v && Object.keys(v).length > 0;
//       },
//       message: props => `${props.value} is not a valid meal plan!`
//     }
//   },
//   createdAt: { 
//     type: Date, 
//     default: Date.now,
//     index: true // Add an index for sorting by creation date
//   },
//   lastModified: {
//     type: Date,
//     default: Date.now
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   }
// }, {
//   timestamps: true, // Adds createdAt and updatedAt timestamps
// });

// // Add a compound index for userId and createdAt for efficient querying of user's meal plans
// mealPlanSchema.index({ userId: 1, createdAt: -1 });

// // Pre-save middleware to update lastModified date
// mealPlanSchema.pre('save', function(next) {
//   this.lastModified = new Date();
//   next();
// });

// // Instance method to deactivate a meal plan
// mealPlanSchema.methods.deactivate = function() {
//   this.isActive = false;
//   return this.save();
// };

// // Static method to find active meal plans for a user
// mealPlanSchema.statics.findActiveForUser = function(userId) {
//   return this.find({ userId: userId, isActive: true }).sort('-createdAt');
// };

// const MealPlan = mongoose.model('MealPlan', mealPlanSchema);

// module.exports = MealPlan;