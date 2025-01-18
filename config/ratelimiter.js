const rateLimit = require('express-rate-limit');
const { logger } = require('./db'); // Import the logger from your db config

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      error: 'Too many requests, please try again later'
    });
  }
});

// Specific limiter for meal plan generation
const mealPlanLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,  // 1 hour
  max: 10, // Limit each IP to 10 meal plan generations per hour
  message: 'Meal plan generation limit reached, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Meal plan generation limit exceeded', {
      ip: req.ip,
      userId: req.user ? req.user : 'anonymous'
    });
    res.status(429).json({
      error: 'Meal plan generation limit reached. Please try again later.'
    });
  }
});

// Authentication rate limiter
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 failed attempts per hour
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Authentication rate limit exceeded', {
      ip: req.ip,
      email: req.body.email
    });
    res.status(429).json({
      error: 'Too many login attempts. Please try again later.'
    });
  }
});

module.exports = {
  apiLimiter,
  mealPlanLimiter,
  authLimiter
};