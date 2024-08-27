    const express = require("express");
    const authRouter = express.Router();
    const {Auth}  = require("../middleware/auth");
    const userAuth = require("../controllers/user")
    const mealPlans = require("../controllers/mealPlanController")
    const auth = new Auth();


    authRouter.post("/api/login/user",userAuth.login)
    authRouter.post("/api/reg/user",userAuth.register)
    authRouter.get("/api/verify-email",userAuth.verifyEmail)
    authRouter.get("/auth/google",userAuth.googleLogin)
    authRouter.get("/google/callback",userAuth.googleCallback)

    authRouter.post("/api/generate/specific-plans",auth.tokenRequired, mealPlans.generateSpecializedMealPlan)
    authRouter.post("/api/get/regular-meal-plans", mealPlans.generateRegularMealPlan)
    authRouter.post("/api/get/past-plans",auth.tokenRequired, mealPlans.getPastMealPlans)
    





    

    module.exports = {
        authRouter,
      };