const express = require("express");
const authRouter = express.Router();
const { Auth } = require("../middleware/auth");
const userAuth = require("../controllers/user");
const mealPlans = require("../controllers/mealPlanController");
const { validate, registerSchema, loginSchema, generateMealPlanSchema, updateUserSchema } = require("../middleware/val");
const auth = new Auth();

authRouter.post("/login/user", validate(loginSchema), userAuth.login);
authRouter.post("/reg/user", validate(registerSchema), userAuth.register);
authRouter.get("/verify-email", userAuth.verifyEmail);
// authRouter.get('/verify-email', (req, res, next) => {
//   console.log('Verify email route hit at:', new Date().toISOString());
//   console.log('Query parameters:', req.query);
//   next();
// }, userAuth.verifyEmail);

authRouter.get("/auth/google", userAuth.googleLogin);
authRouter.get("/google/callback", userAuth.googleCallback);

authRouter.post("/get/generate-meal-plans", validate(generateMealPlanSchema), mealPlans.generateMealPlan);
authRouter.get("/get/past-plans", auth.tokenRequired, mealPlans.getPastMealPlans);
authRouter.put('/update/user', auth.tokenRequired, validate(updateUserSchema), userAuth.editUser);

module.exports = {
  authRouter,
};
