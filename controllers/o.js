// const verifyEmail = async (req, res) => {
//     try {
//       const { token } = req.query;
  
//       const user = await User.findOne({ verificationToken: token, isVerified: false });
  
//       if (!user) return res.status(400).json({ error: 'Invalid token or already verified' });
  
//       // Mark the user as verified
//       user.isVerified = true;
//       user.verificationToken = undefined;
//       await user.save();
  
  
//       // Generate meal plan using AI service
//       const mealPlanData = await sendUserDataToAI({
//         tribe: user.tribe,
//         state: user.state,
//         age: user.age,
//         gender: user.gender,
//         duration: user.duration,
//         dislikedMeals: user.dislikedMeals
//       });
      
  
  
//       // Save the meal plan in the MealPlan table
//       const mealPlan = new MealPlan({
//         userId: user._id,
//         duration: user.duration,
//         plan: mealPlanData
//       });
//       await mealPlan.save();
  
//       // Generate authentication token
//       const authToken = auth.generateAuthToken(user);
  
//       res.status(200).json({
//         message: 'Email verified successfully',
//         mealPlan: mealPlanData,
//         token: authToken,
//         userData:user
//       });
//     } catch (error) {
//       console.error('Error verifying email:', error);
//       res.status(500).json({ error: 'Failed to verify email' });
//     }
//   };
  
  
//   // Register User
//   const register = async (req, res) => {
//     try {
//       const { fullName, email, weight, height, age, dietaryNeeds,dislikedMeals, duration, tribe, state, gender } = req.body;
  
//       // Validate if all required fields are present
//       if (!fullName || !email || !weight || !height || !age || !dietaryNeeds || !duration || !tribe || !state || !gender) {
//         return res.status(400).json({ error: 'All fields are required' });
//       }
  
//       let user = await User.findOne({ email });
  
//       if (!user) {
//         // Create a new user and send verification email
//         const verificationToken = crypto.randomBytes(32).toString('hex');
//         user = new User({
//           fullName,
//           email,
//           weight,
//           height,
//           age,
//           dietaryNeeds,
//           dislikedMeals,
//           duration,
//           tribe,
//           state,
//           gender,
//           verificationToken,
//         });
//         await user.save();
  
//         console.log(user);
  
//         console.log(`Verification token for ${email}: ${verificationToken}`);
//         await sendVerificationEmail(user, verificationToken);
  
//         return res.status(200).json({ message: 'Please verify your email to complete registration.' });
//       }
  
//       if (!user.isVerified) {
//         // If the email is not verified, resend the verification email
//         const verificationToken = crypto.randomBytes(32).toString('hex');
//         user.verificationToken = verificationToken;
//         await user.save();
//         await sendVerificationEmail(user, verificationToken);
  
//         return res.status(200).json({ message: 'A new verification email has been sent to your email address.' });
//       }
  
      
  
//       // If already verified, generate meal plan and save it in the MealPlan table
//       const mealPlanData = await sendUserDataToAI({
//         tribe: user.tribe,
//         state: user.state,
//         age: user.age,
//         gender: user.gender,
//         duration: user.duration,
//         dislikedMeals: user.dislikedMeals
//       });
  
//       const mealPlan = new MealPlan({
//         userId: user._id,
//         duration: user.duration,
//         plan: mealPlanData
//       });
//       await mealPlan.save();
  
//       const token = auth.generateAuthToken(user);
//       res.status(200).json({ message: 'Registration successful', mealPlan: mealPlanData, token });
//     } catch (error) {
//       console.error('Error registering user:', error);
//       res.status(500).json({ error: 'Failed to register user' });
//     }
//   };











  const verifyEmail = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      console.log('Starting email verification process');
      const { token } = req.query;
  
      const user = await User.findOne({ verificationToken: token, isVerified: false }).session(session);
  
      if (!user) {
        console.log('Invalid token or user already verified');
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: 'Invalid token or already verified' });
      }
  
      console.log('Updating user verification status');
      user.isVerified = true;
      user.verificationToken = undefined;
      await user.save({ session });
  
      console.log('Generating meal plan');
      let mealPlanData;
      try {
        mealPlanData = await sendUserDataToAI({
          tribe: user.tribe,
          state: user.state,
          age: user.age,
          gender: user.gender,
          duration: user.duration,
          dislikedMeals: user.dislikedMeals
        });
      } catch (aiError) {
        console.error('Error generating meal plan:', aiError);
        mealPlanData = null; // or a default meal plan
      }
  
      console.log('Saving meal plan');
      const mealPlan = new MealPlan({
        userId: user._id,
        duration: user.duration,
        plan: mealPlanData
      });
      await mealPlan.save({ session });
  
      console.log('Generating authentication token');
      const authToken = auth.generateAuthToken(user);
  
      await session.commitTransaction();
      session.endSession();
  
      console.log('Email verification process completed successfully');
      res.status(200).json({
        message: 'Email verified successfully',
        mealPlan: mealPlanData,
        token: authToken,
        userData: user
      });
    } catch (error) {
      console.error('Error in email verification process:', error);
      await session.abortTransaction();
      session.endSession();
      
      if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
        return res.status(503).json({ error: 'Database operation timed out. Please try again later.' });
      }
      res.status(500).json({ error: 'Failed to verify email' });
    }
  };