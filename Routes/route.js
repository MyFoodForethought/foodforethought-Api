const express = require("express");
const authRouter = express.Router();
const { Auth } = require("../middleware/auth");
const userAuth = require("../controllers/user");
const mealPlans = require("../controllers/mealPlanController");
const { validate, registerSchema, loginSchema, generateMealPlanSchema, updateUserSchema } = require("../middleware/val");
const auth = new Auth();


/**
 * @swagger
 * /api/login/user:
 *   post:
 *     summary: Login a user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               fullName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */

authRouter.post("/login/user", validate(loginSchema), userAuth.login);


/**
 * @swagger
 * /api/reg/user:
 *   post:
 *     summary: Register a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               weight:
 *                 type: number
 *               height:
 *                 type: number
 *               age:
 *                 type: number
 *               dietaryNeeds:
 *                 type: string
 *               duration:
 *                 type: string
 *               dislikedMeals:
 *                 type: string
 *               tribe:
 *                 type: string
 *               state:
 *                 type: string
 *               gender:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification email sent
 *       400:
 *         description: Bad request
 */

authRouter.post("/reg/user", validate(registerSchema), userAuth.register);

/**
 * @swagger
 * /api/verify-email:
 *   get:
 *     summary: Verify user email
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Registration successful
 *       400:
 *         description: Invalid token
 */
authRouter.get("/verify-email", userAuth.verifyEmail);

/**
 * @swagger
 * /api/verify-login:
 *   get:
 *     summary: Verify login token
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */
authRouter.get("/verify-login", userAuth.verifyLogin);
// Google OAuth routes
/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Authenticate using Google
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Redirects to Google login
 */
authRouter.get("/auth/google", userAuth.googleLogin);
/**
 * @swagger
 * /api/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Google login callback successful
 */
authRouter.get("/google/callback", userAuth.googleCallback);
/**
 * @swagger
 * /api/get/generate-meal-plans:
 *   post:
 *     summary: Generate meal plans
 *     tags: [Meal Plans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               duration:
 *                 type: string
 *               dislikedMeals:
 *                 type: string
 *     responses:
 *       200:
 *         description: Meal plans generated successfully
 *       400:
 *         description: Bad request
 */

authRouter.post("/get/generate-meal-plans", validate(generateMealPlanSchema), mealPlans.generateMealPlan);
/**
 * @swagger
 * /api/get/past-plans:
 *   get:
 *     summary: Get past meal plans
 *     tags: [Meal Plans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Past meal plans retrieved
 *       401:
 *         description: Unauthorized
 */
authRouter.get("/get/past-plans", auth.tokenRequired, mealPlans.getPastMealPlans);

/**
 * @swagger
 * /api/update/user:
 *   put:
 *     summary: Update user information
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               weight:
 *                 type: number
 *               height:
 *                 type: number
 *               age:
 *                 type: number
 *               dietaryNeeds:
 *                 type: string
 *               tribe:
 *                 type: string
 *               state:
 *                 type: string
 *               gender:
 *                 type: string
 *     responses:
 *       200:
 *         description: User information updated successfully
 *       401:
 *         description: Unauthorized
 */
authRouter.put('/update/user', auth.tokenRequired, validate(updateUserSchema), userAuth.editUser);

authRouter.get("/user-profile", auth.tokenRequired, userAuth.getUserProfile);
authRouter.put("/update-disliked-meals", auth.tokenRequired, userAuth.updateDislikedMeals);
authRouter.delete("/delete-account", auth.tokenRequired, userAuth.deleteAccount);


module.exports = {
  authRouter,
};
