

const mongoose = require('mongoose');
const winston = require('winston');
require('dotenv').config();

// Initialize Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ],
});

// Use environment variables for sensitive information
const uri = process.env.MONGO_URI || process.env.MONGO_URI_LOCAL

const connectDB = async (maxRetries = 5, delay = 5000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await mongoose.connect(uri, {
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4, skip trying IPv6
      });

      logger.info("Successfully connected to MongoDB!");
      
      // Set up connection monitoring
      mongoose.connection.on('error', err => {
        logger.error('MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting to reconnect...');
        setTimeout(() => connectDB(maxRetries, delay), delay);
      });

      return mongoose.connection;
    } catch (error) {
      logger.error(`Connection attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) {
        logger.error('Failed to connect to MongoDB after maximum retries');
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Graceful shutdown function
const closeConnection = async () => {
  try {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed.");
  } catch (err) {
    logger.error("Error closing MongoDB connection:", err);
  }
};

// Database health check function
const checkDatabaseHealth = async () => {
  try {
    await mongoose.connection.db.admin().ping();
    logger.info("Database health check: OK");
    return true;
  } catch (error) {
    logger.error("Database health check failed:", error);
    return false;
  }
};

module.exports = { connectDB, closeConnection, checkDatabaseHealth, logger };























// const mongoose = require('mongoose');
// const winston = require('winston');
// require('dotenv').config();

// // Initialize Winston logger with more detailed formatting
// const logger = winston.createLogger({
//   level: 'info',
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.errors({ stack: true }),
//     winston.format.json(),
//     winston.format.printf(({ timestamp, level, message, ...metadata }) => {
//       return `${timestamp} ${level}: ${message} ${Object.keys(metadata).length ? JSON.stringify(metadata) : ''}`;
//     })
//   ),
//   transports: [
//     new winston.transports.Console({
//       format: winston.format.combine(
//         winston.format.colorize(),
//         winston.format.simple()
//       )
//     }),
//     new winston.transports.File({ filename: 'error.log', level: 'error' }),
//     new winston.transports.File({ filename: 'combined.log' })
//   ],
// });

// // MongoDB Connection URI with fallback
// const uri = process.env.MONGO_URI || process.env.MONGO_URI_LOCAL;

// // Enhanced MongoDB connection options
// const mongooseOptions = {
//   maxPoolSize: 50,           
//   minPoolSize: 10,           
//   socketTimeoutMS: 45000,    
//   serverSelectionTimeoutMS: 30000, 
//   family: 4,                 
//   connectTimeoutMS: 30000,   
//   retryWrites: true,        
//   w: 'majority',            
//   readPreference: 'primary', 
//   autoIndex: false,         
//   heartbeatFrequencyMS: 10000
//   // Removed: keepAlive and keepAliveInitialDelay as they're not supported
// };

// // Connection monitoring and management
// const connectDB = async (maxRetries = 5, initialDelay = 5000) => {
//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       logger.info(`MongoDB connection attempt ${attempt} of ${maxRetries}`);
      
//       // Connect with enhanced options
//       await mongoose.connect(uri, mongooseOptions);
      
//       // Set up connection monitoring
//       setupMongooseEventListeners();
      
//       logger.info('Successfully connected to MongoDB');
//       return mongoose.connection;
//     } catch (error) {
//       logger.error(`Connection attempt ${attempt} failed:`, { 
//         error: error.message, 
//         stack: error.stack 
//       });

//       if (attempt === maxRetries) {
//         logger.error('Max retries reached, giving up');
//         throw error;
//       }

//       // Exponential backoff
//       const delay = initialDelay * Math.pow(2, attempt - 1);
//       logger.info(`Waiting ${delay}ms before next attempt`);
//       await new Promise(resolve => setTimeout(resolve, delay));
//     }
//   }
// };

// // Enhanced event listeners
// const setupMongooseEventListeners = () => {
//   mongoose.connection.on('connecting', () => {
//     logger.info('Connecting to MongoDB...');
//   });

//   mongoose.connection.on('connected', () => {
//     logger.info('MongoDB connected');
//   });

//   mongoose.connection.on('disconnecting', () => {
//     logger.warn('MongoDB disconnecting...');
//   });

//   mongoose.connection.on('disconnected', () => {
//     logger.warn('MongoDB disconnected');
//   });

//   mongoose.connection.on('reconnected', () => {
//     logger.info('MongoDB reconnected');
//   });

//   mongoose.connection.on('error', (err) => {
//     logger.error('MongoDB connection error:', { 
//       error: err.message, 
//       stack: err.stack 
//     });
//   });
// };

// // Enhanced database health check
// const checkDatabaseHealth = async () => {
//   try {
//     if (mongoose.connection.readyState !== 1) {
//       logger.warn(`Database not connected. Current state: ${mongoose.connection.readyState}`);
//       return {
//         healthy: false,
//         status: 'disconnected',
//         readyState: mongoose.connection.readyState
//       };
//     }

//     const adminDb = mongoose.connection.db.admin();
//     const serverStatus = await adminDb.serverStatus();
//     const ping = await adminDb.ping();

//     const health = {
//       healthy: true,
//       status: 'connected',
//       connections: serverStatus.connections,
//       uptime: serverStatus.uptime,
//       ping: ping.ok,
//       readyState: mongoose.connection.readyState,
//       connectionPool: {
//         total: serverStatus.connections.current,
//         available: serverStatus.connections.available,
//         active: serverStatus.connections.active
//       }
//     };

//     logger.info('Database health check:', health);
//     return health;
//   } catch (error) {
//     logger.error('Database health check failed:', { 
//       error: error.message, 
//       stack: error.stack 
//     });
//     return {
//       healthy: false,
//       status: 'error',
//       error: error.message
//     };
//   }
// };

// // Graceful shutdown function
// const closeConnection = async () => {
//   try {
//     await mongoose.connection.close();
//     logger.info('MongoDB connection closed gracefully');
//   } catch (err) {
//     logger.error('Error closing MongoDB connection:', { 
//       error: err.message, 
//       stack: err.stack 
//     });
//     throw err;
//   }
// };

// // Process handlers for graceful shutdown
// process.on('SIGINT', async () => {
//   try {
//     logger.info('SIGINT signal received');
//     await closeConnection();
//     logger.info('Process terminated gracefully');
//     process.exit(0);
//   } catch (error) {
//     logger.error('Error during shutdown:', { 
//       error: error.message, 
//       stack: error.stack 
//     });
//     process.exit(1);
//   }
// });

// process.on('SIGTERM', async () => {
//   try {
//     logger.info('SIGTERM signal received');
//     await closeConnection();
//     logger.info('Process terminated gracefully');
//     process.exit(0);
//   } catch (error) {
//     logger.error('Error during shutdown:', { 
//       error: error.message, 
//       stack: error.stack 
//     });
//     process.exit(1);
//   }
// });

// // Export utilities
// module.exports = {
//   connectDB,
//   closeConnection,
//   checkDatabaseHealth,
//   logger,
//   mongooseOptions
// };