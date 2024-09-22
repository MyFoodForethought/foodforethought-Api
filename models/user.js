const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const dropUserCollection = async () => {
  try {
    await User.collection.drop();
    console.log('User collection dropped successfully');
  } catch (error) {
    console.error('Error dropping User collection:', error.message);
  }
};

// Define the schema
const userSchema = new Schema({
  fullName: { type: String },
  email: { type: String, required: true, unique: true },
  profilePicture: { type: String, default: '/images/default-img.jpg' },
  weight: { type: Number },
  height: { type: Number },
  age: { type: Number }, // Integer for age
  dietaryNeeds: { type: String },
  // duration: { type: String, enum: ['one week', 'two weeks']},
  duration: { type: String},
  dislikedMeals: { type: String },
  tribe: { type: String }, // String for tribe
  state: { type: String }, // String for state
  gender: { type: String, enum: ['male', 'female', 'other'] }, // String for gender
  mealPlan: { type: Object },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  freeMealPlans: { type: Number, default: 2 },
});

// Adding indexes
userSchema.index({ email: 1 }); // Ensure that email field is unique (already specified with unique: true)
userSchema.index({ age: 1 }); // Add an index on age
userSchema.index({ state: 1 }); // Add an index on state
userSchema.index({ tribe: 1 }); // Add an index on tribe
userSchema.index({ gender: 1 }); // Add an index on gender

// Compound index example
userSchema.index({ age: 1, state: 1 }); // Add a compound index on age and state

const User = mongoose.model('User', userSchema);

module.exports = { User, dropUserCollection };
