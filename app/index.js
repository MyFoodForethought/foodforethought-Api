require("dotenv").config();
const express = require('express');
const MongoStore = require('connect-mongo');
const session = require('express-session');
const passport = require('passport');
const { authRouter } = require('../Routes/route');
const { connectDB, closeConnection, checkDatabaseHealth } = require('../config/db');
require('../config/passport');
const oauthRouter = require('../Routes/oauth');
const winston = require('winston');
const helmet = require('helmet');
const rateLimit = require("express-rate-limit");
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const {dropUserCollection} = require('../models/user')
const {dropMealCollection} = require('../models/mealPlan')




// Swagger options
const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'FoodForThought API',
      version: '1.0.0',
      description: 'API documentation for the FoodForThought application',
    },
    servers: [
      {
        url: process.env.BASE_URL,
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to your route files
};






// Initialize Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ],
});

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
app.set('trust proxy', 1);
// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(require("cors")(corsOptions));

// Enhanced logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    protocol: req.protocol,
    secure: req.secure,
    ip: req.ip,
    xhr: req.xhr,
    tls: req.client.authorized
  });
  next();
});

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI
    }),
    cookie: { 
      secure: true, // Always use secure cookies with Railway.app
      httpOnly: true,
      sameSite: 'strict'
    }
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Mount routes
app.use('/api', authRouter);
app.use('/oauth', oauthRouter);

// Root route
app.get('/', (req, res) => {
    res.send('OAuth authentication successful. You can now use the application.');
});

// Health check route
app.get('/health', async (req, res) => {
  try {
    const isDatabaseHealthy = await checkDatabaseHealth();
    if (isDatabaseHealthy) {
      res.status(200).json({ status: 'OK', database: 'Connected' });
    } else {
      res.status(503).json({ status: 'Error', database: 'Disconnected' });
    }
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({ status: 'Error', message: 'Health check failed' });
  }
});
const swaggerSpec = swaggerJsDoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
const PORT = process.env.PORT || 3000;
// const PORT = process.env.PORT_LOCAL || process.env.PORT;




async function startServer() {
    try {
        await connectDB();
        // await dropUserCollection()
        // await dropMealCollection()
        
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`);
        });
    } catch (error) {
        logger.error('Failed to start the server:', error);
        process.exit(1);
    }
}

// if (process.env.NODE_ENV === 'test') {
//   PORT = 3002; // or any other available port
// }

// Graceful shutdown
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully.`);
  
  try {
    await closeConnection();
    logger.info('Database connection closed.');
    process.exit(0);
  } catch (err) {
    logger.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
}

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();

module.exports = app; // For testing purposes