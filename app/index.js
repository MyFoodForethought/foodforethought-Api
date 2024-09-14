require("dotenv").config();
const express = require('express');
const MongoStore = require('connect-mongo');
const session = require('express-session');
const passport = require('passport');
const { authRouter } = require('../Routes/route');
const { connectDB } = require('../config/db');
const { dropUserCollection } = require('../models/user')
require('../config/passport');
const oauthRouter = require('../Routes/oauth');
const winston = require('winston');

// Initialize Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});

const app = express();

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require("cors")());

// CORS headers
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI
    }),
    cookie: { secure: true} // Set secure: true if using HTTPS
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Mount routes
app.use('/api', authRouter);  // Mount authRouter under /api
app.use('/oauth', oauthRouter); // Use OAuth routes

// Root route
app.get('/', (req, res) => {
    res.send('OAuth authentication successful. You can now use the application.');
});

// Health check route
app.get('/health', async (req, res) => {
  try {
    await connectDB();
    res.status(200).json({ status: 'OK', database: 'Connected' });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({ status: 'Error', database: 'Disconnected' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
const PORT = process.env.PORT || 3000;
async function startServer() {
    try {
        await connectDB();  // Connect to MongoDB
        // await dropUserCollection() // Uncomment if you need to drop the user collection
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to connect to the database', error);
        process.exit(1);  // Exit if DB connection fails
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully');
  process.exit(0);
});

startServer();

module.exports = app; // For testing purposes