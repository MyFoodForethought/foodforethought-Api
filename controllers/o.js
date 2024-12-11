// Add this to the user controller file

const getUserStatistics = async (req, res) => {
    try {
      // Get total number of registered users
      const totalUsers = await User.countDocuments();
  
      // Get users with their meal plan counts
      const userStats = await User.aggregate([
        {
          // First lookup to join with meal plans
          $lookup: {
            from: 'mealplans', // Collection name (usually lowercase)
            localField: '_id',
            foreignField: 'userId',
            as: 'mealPlans'
          }
        },
        {
          // Add calculated fields
          $addFields: {
            mealPlanCount: { $size: '$mealPlans' },
            // Check if user is verified
            isVerified: { $toBool: '$isVerified' },
            // Calculate days since registration using createdAt
            daysSinceRegistration: {
              $divide: [
                { $subtract: [new Date(), '$createdAt'] },
                1000 * 60 * 60 * 24 // Convert milliseconds to days
              ]
            }
          }
        },
        {
          // Group all users to get summary statistics
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            verifiedUsers: { $sum: { $cond: ['$isVerified', 1, 0] } },
            totalMealPlans: { $sum: '$mealPlanCount' },
            averageMealPlansPerUser: { $avg: '$mealPlanCount' },
            usersWithNoMealPlans: { 
              $sum: { $cond: [{ $eq: ['$mealPlanCount', 0] }, 1, 0] }
            },
            // Get user distribution by meal plan count
            usersByMealPlanCount: {
              $push: {
                userId: '$_id',
                email: '$email',
                mealPlanCount: '$mealPlanCount',
                daysSinceRegistration: '$daysSinceRegistration'
              }
            }
          }
        },
        {
          // Final projection to format the response
          $project: {
            _id: 0,
            totalUsers: 1,
            verifiedUsers: 1,
            totalMealPlans: 1,
            averageMealPlansPerUser: { $round: ['$averageMealPlansPerUser', 2] },
            usersWithNoMealPlans: 1,
            // Sort users by meal plan count and limit to top 10
            topUsersByMealPlans: {
              $slice: [{
                $sortArray: {
                  input: '$usersByMealPlanCount',
                  sortBy: { mealPlanCount: -1 }
                }
              }, 10]
            }
          }
        }
      ]);
  
      // If no results, return empty statistics
      if (!userStats.length) {
        return res.status(200).json({
          totalUsers: 0,
          verifiedUsers: 0,
          totalMealPlans: 0,
          averageMealPlansPerUser: 0,
          usersWithNoMealPlans: 0,
          topUsersByMealPlans: []
        });
      }
  
      res.status(200).json(userStats[0]);
    } catch (error) {
      console.error('Error getting user statistics:', error);
      res.status(500).json({ error: 'Failed to retrieve user statistics' });
    }
  };
  
  // Don't forget to add this to your exports
  module.exports = { 
    register, 
    verifyEmail, 
    getFeedbacks, 
    submitFeedback, 
    verifyLogin, 
    login, 
    googleLogin, 
    googleCallback, 
    generateToken, 
    editUser, 
    getUserProfile, 
    updateDislikedMeals, 
    deleteAccount,
    getUserStatistics  // Add this line
  };