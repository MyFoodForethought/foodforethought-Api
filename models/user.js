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

const userSchema = new Schema({
  fullName: { type: String },
  email: { type: String, required: true, unique: true },
  profilePicture: { type: String, default: '/images/default-img.jpg' },
  weight: { type: Number },
  height: { type: Number },
  age: { type: Number }, // Integer for age
  dietaryNeeds: { type: String },
  duration: { type: String, enum: ['one week', 'two weeks'], required: true },
  dislikedMeals:  { type: String },
  tribe: { type: String }, // String for tribe
  state: { type: String }, // String for state
  gender: { type: String, enum: ['male', 'female', 'other'] }, // String for gender
  mealPlan: { type: Object },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  freeMealPlans: { type: Number, default: 2 },
});

const User = mongoose.model('User', userSchema);

module.exports = { User, dropUserCollection };
