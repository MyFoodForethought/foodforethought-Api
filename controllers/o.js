// const mongoose = require('mongoose');
// const winston = require('winston');
// require('dotenv').config();

// // Initialize Winston logger
// const logger = winston.createLogger({
//   level: 'info',
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.printf(({ timestamp, level, message }) => {
//       return `${timestamp} ${level}: ${message}`;
//     })
//   ),
//   transports: [
//     new winston.transports.Console(),
//     new winston.transports.File({ filename: 'error.log', level: 'error' }),
//     new winston.transports.File({ filename: 'combined.log' })
//   ],
// });

// // Use environment variables for sensitive information
// const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/yourdbname';

// const connectDB = async (maxRetries = 5, delay = 5000) => {
//   for (let i = 0; i < maxRetries; i++) {
//     try {
//       await mongoose.connect(uri, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//         serverSelectionTimeoutMS: 30000,
//         socketTimeoutMS: 45000,
//         family: 4, // Use IPv4, skip trying IPv6
//       });

//       logger.info("Successfully connected to MongoDB!");
      
//       // Set up connection monitoring
//       mongoose.connection.on('error', err => {
//         logger.error('MongoDB connection error:', err);
//       });
      
//       mongoose.connection.on('disconnected', () => {
//         logger.warn('MongoDB disconnected. Attempting to reconnect...');
//         setTimeout(() => connectDB(maxRetries, delay), delay);
//       });

//       return mongoose.connection;
//     } catch (error) {
//       logger.error(`Connection attempt ${i + 1} failed:`, error);
//       if (i === maxRetries - 1) {
//         logger.error('Failed to connect to MongoDB after maximum retries');
//         throw error;
//       }
//       await new Promise(resolve => setTimeout(resolve, delay));
//     }
//   }
// };

// // Graceful shutdown function
// const closeConnection = async () => {
//   try {
//     await mongoose.connection.close();
//     logger.info("MongoDB connection closed.");
//   } catch (err) {
//     logger.error("Error closing MongoDB connection:", err);
//   }
// };

// // Database health check function
// const checkDatabaseHealth = async () => {
//   try {
//     await mongoose.connection.db.admin().ping();
//     logger.info("Database health check: OK");
//     return true;
//   } catch (error) {
//     logger.error("Database health check failed:", error);
//     return false;
//   }
// };

// module.exports = { connectDB, closeConnection, checkDatabaseHealth, logger };