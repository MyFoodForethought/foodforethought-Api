const { User } = require('../models/user');
const { MealPlan } = require('../models/mealPlan');
const { sendMealPlanNotification } = require('../services/emailService');
const { sendUserDataToAI } = require('../services/aiServices');
const { Auth } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const auth = new Auth();

// Helper function to start session and handle errors
const withTransaction = async (operations) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await operations(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const generateMealPlan = async (req, res) => {
  const { duration, dislikedMeals, age, gender, tribe, state } = req.body;

  try {
    return await withTransaction(async (session) => {
      let user = null;
      const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
          const userEmail = decoded.email;

          user = await User.findOne({ email: userEmail }).session(session);
          
          if (user) {
            const updates = {};
            if (!user.age && age) updates.age = age;
            if (!user.gender && gender) updates.gender = gender;
            if (!user.tribe && tribe) updates.tribe = tribe;
            if (!user.state && state) updates.state = state;
            if (!user.dislikedMeals && dislikedMeals) updates.dislikedMeals = dislikedMeals;
            if (!user.duration && duration) updates.duration = duration;

            if (Object.keys(updates).length > 0) {
              user = await User.findOneAndUpdate(
                { email: userEmail },
                { $set: updates },
                { new: true, session }
              );
            }

            const userTribe = user.tribe || tribe;
            const userState = user.state || state;
            const userAge = user.age || age;
            const userGender = user.gender || gender;
            const userDislikedMeals = user.dislikedMeals || dislikedMeals;
            const userDuration = user.duration || duration;

            const aiResponse = await sendUserDataToAI({
              tribe: userTribe,
              state: userState,
              age: userAge,
              gender: userGender,
              dislikedMeals: userDislikedMeals,
              duration: userDuration,
            });

            const mealPlan = new MealPlan({
              userId: user._id,
              duration: userDuration,
              plan: aiResponse,
            });
            await mealPlan.save({ session });

            await sendMealPlanNotification(user);

            return res.status(200).json({ mealPlan, token });
          }
        } catch (err) {
          console.error('Token verification error:', err);
          return res.status(401).json({ error: 'Invalid or expired token' });
        }
      }

      // Handle non-authenticated users
      const ip = req.ip;
      const sessionMealPlans = req.session.mealPlans || 0;

      if (sessionMealPlans >= 2) {
        return res.status(403).json({ error: 'Sign up required to generate more meal plans' });
      }

      req.session.mealPlans = sessionMealPlans + 1;

      const aiResponse = await sendUserDataToAI({
        tribe,
        state,
        age,
        gender,
        dislikedMeals,
        duration,
      });

      const mealPlan = new MealPlan({
        userId: null,
        duration,
        plan: aiResponse,
      });
      await mealPlan.save({ session });

      return res.status(200).json({ mealPlan });
    });
  } catch (error) {
    console.error('Error generating meal plan:', error);
    return res.status(500).json({ error: 'Failed to generate meal plan' });
  }
};

const regenerateMealPlan = async (req, res) => {
  try {
    return await withTransaction(async (session) => {
      const { mealPlanId } = req.params;
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findOne({ email: decoded.email }).session(session);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const existingMealPlan = await MealPlan.findById(mealPlanId).session(session);
      if (!existingMealPlan) {
        return res.status(404).json({ error: 'Meal plan not found' });
      }

      const aiResponse = await sendUserDataToAI({
        tribe: user.tribe,
        state: user.state,
        age: user.age,
        gender: user.gender,
        dislikedMeals: user.dislikedMeals,
        duration: existingMealPlan.duration
      });

      existingMealPlan.plan = aiResponse;
      await existingMealPlan.save({ session });

      await sendMealPlanNotification(user);

      return res.status(200).json({ mealPlan: existingMealPlan });
    });
  } catch (error) {
    console.error('Error regenerating meal plan:', error);
    return res.status(500).json({ error: 'Failed to regenerate meal plan' });
  }
};

const getPastMealPlans = async (req, res) => {
  try {
    return await withTransaction(async (session) => {
      const userEmail = req.user;
      
      if (!userEmail) {
        return res.status(400).json({ error: 'No email found in the token' });
      }

      const user = await User.findOne({ email: userEmail }).session(session);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const mealPlans = await MealPlan
        .find({ userId: user._id })
        .sort({ createdAt: -1 })
        .session(session);

      return res.json(mealPlans);
    });
  } catch (error) {
    console.error('Error retrieving past meal plans:', error);
    return res.status(500).json({ error: 'Failed to retrieve meal plans' });
  }
};

const getMealPlanById = async (req, res) => {
  try {
    return await withTransaction(async (session) => {
      const { mealPlanId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(mealPlanId)) {
        return res.status(400).json({ error: 'Invalid meal plan ID format' });
      }

      const mealPlan = await MealPlan.findById(mealPlanId).session(session);

      if (!mealPlan) {
        return res.status(404).json({ error: 'Meal plan not found' });
      }

      return res.status(200).json({ mealPlan });
    });
  } catch (error) {
    console.error('Error retrieving meal plan by ID:', error);
    return res.status(500).json({ error: 'Failed to retrieve meal plan' });
  }
};

const editUserMealDetails = async (req, res) => {
  const { duration, dislikedMeals, age, gender, tribe, state } = req.body;

  try {
    return await withTransaction(async (session) => {
      const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Authentication token required' });
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const userEmail = decoded.email;

      const user = await User.findOne({ email: userEmail }).session(session);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updates = {};
      if (age !== undefined) updates.age = age;
      if (gender !== undefined) updates.gender = gender;
      if (tribe !== undefined) updates.tribe = tribe;
      if (state !== undefined) updates.state = state;
      if (dislikedMeals !== undefined) updates.dislikedMeals = dislikedMeals;
      if (duration !== undefined) updates.duration = duration;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No details provided to update' });
      }

      const updatedUser = await User.findOneAndUpdate(
        { email: userEmail },
        { $set: updates },
        { new: true, session }
      );

      return res.status(200).json({
        message: 'User meal details updated successfully',
        user: updatedUser
      });
    });
  } catch (error) {
    console.error('Error updating user meal details:', error);
    return res.status(500).json({ error: 'Failed to update user meal details' });
  }
};

const deleteMealPlanById = async (req, res) => {
  try {
    return await withTransaction(async (session) => {
      const { mealPlanId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(mealPlanId)) {
        return res.status(400).json({ error: 'Invalid meal plan ID format' });
      }

      const mealPlan = await MealPlan.findByIdAndDelete(mealPlanId).session(session);

      if (!mealPlan) {
        return res.status(404).json({ error: 'Meal plan not found' });
      }

      return res.status(200).json({ message: 'Meal plan deleted successfully' });
    });
  } catch (error) {
    console.error('Error deleting meal plan by ID:', error);
    return res.status(500).json({ error: 'Failed to delete meal plan' });
  }
};

const editMealPlanById = async (req, res) => {
  try {
    return await withTransaction(async (session) => {
      const { mealPlanId } = req.params;
      const { duration, plan, userId, createdAt } = req.body;

      if (!mongoose.Types.ObjectId.isValid(mealPlanId)) {
        return res.status(400).json({ error: 'Invalid meal plan ID format' });
      }

      const updates = {};
      if (duration !== undefined) updates.duration = duration;
      if (plan !== undefined) updates.plan = plan;
      if (userId !== undefined) updates.userId = userId;
      if (createdAt !== undefined) updates.createdAt = createdAt;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No details provided to update' });
      }

      const updatedMealPlan = await MealPlan.findByIdAndUpdate(
        mealPlanId,
        { $set: updates },
        { new: true, session }
      );

      if (!updatedMealPlan) {
        return res.status(404).json({ error: 'Meal plan not found' });
      }

      return res.status(200).json({
        message: 'Meal plan updated successfully',
        mealPlan: updatedMealPlan
      });
    });
  } catch (error) {
    console.error('Error updating meal plan by ID:', error);
    return res.status(500).json({ error: 'Failed to update meal plan' });
  }
};

module.exports = {
  generateMealPlan,
  regenerateMealPlan,
  getPastMealPlans,
  getMealPlanById,
  deleteMealPlanById,
  editUserMealDetails,
  editMealPlanById
};