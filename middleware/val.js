const Joi = require('joi');

// Validation schema for user registration
const registerSchema = Joi.object({
  fullName: Joi.string().required(),
  email: Joi.string().email().required(),
  // weight: Joi.number().required(),
  // height: Joi.number().required(),
  // age: Joi.number().required(),
  // dietaryNeeds: Joi.string().required(),
  // dislikedMeals: Joi.string().required(),
  // duration: Joi.string().valid('one week', 'two weeks').required(),
  // tribe: Joi.string().required(),
  // state: Joi.string().required(),
  // gender: Joi.string().valid('male', 'female', 'other').required()
});

// Validation schema for user login
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  fullName: Joi.string().optional()
});

// Validation schema for generating meal plans
const generateMealPlanSchema = Joi.object({
  duration: Joi.string().valid('one week', 'two weeks').required(),
  dislikedMeals: Joi.string().required(),
  age: Joi.number().required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  tribe: Joi.string().required(),
  state: Joi.string().required()
});

// Validation schema for updating user
const updateUserSchema = Joi.object({
  fullName: Joi.string().optional(),
  weight: Joi.number().optional(),
  height: Joi.number().optional(),
  age: Joi.number().optional(),
  dietaryNeeds: Joi.string().optional(),
  dislikedMeals: Joi.string().required(),
  duration: Joi.string().valid('one week', 'two weeks').optional(),
  tribe: Joi.string().optional(),
  state: Joi.string().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional()
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  generateMealPlanSchema,
  updateUserSchema
};
