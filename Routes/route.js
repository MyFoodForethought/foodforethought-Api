const express = require("express");
const authRouter = express.Router();
const { Auth } = require("../middleware/auth");
const userAuth = require("../controllers/user");
const mealPlans = require("../controllers/mealPlanController");
const { validate, registerSchema, loginSchema, generateMealPlanSchema, updateUserSchema } = require("../middleware/val");
const auth = new Auth();

authRouter.post("/api/login/user", validate(loginSchema), userAuth.login);
authRouter.post("/api/reg/user", validate(registerSchema), userAuth.register);
authRouter.get("/api/verify-email", userAuth.verifyEmail);
authRouter.get("/auth/google", userAuth.googleLogin);
authRouter.get("/google/callback", userAuth.googleCallback);

authRouter.post("/api/get/generate-meal-plans", validate(generateMealPlanSchema), mealPlans.generateMealPlan);
authRouter.get("/api/get/past-plans", auth.tokenRequired, mealPlans.getPastMealPlans);
authRouter.put('/api/update/user', auth.tokenRequired, validate(updateUserSchema), userAuth.editUser);

module.exports = {
  authRouter,
};
