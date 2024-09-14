// const mongoose = require('mongoose');

// async function connectDB() {
//     try {
//         await mongoose.connect(process.env.MONGO_URI_LOCAL, {
//             // useNewUrlParser: true, // Remove this
//             // useUnifiedTopology: true, // Remove this
//         });
//         console.log('MongoDB connected');
//     } catch (error) {
//         console.error('Failed to connect to MongoDB', error);
//         process.exit(1);
//     }
// }

// module.exports = { connectDB };

const { MongoClient, ServerApiVersion, MongoServerError, MongoNetworkError } = require('mongodb');
const winston = require('winston');
require('dotenv').config();

// Initialize Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});

// Use environment variables for sensitive information
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';

const client = new MongoClient(uri, {
  maxPoolSize: 10, // Adjust based on your needs
  minPoolSize: 5,
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 30000, // Increase connection timeout
  socketTimeoutMS: 45000 // Increase socket timeout
});

async function connectDB(maxRetries = 5, delay = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Connect the client to the server
      await client.connect();
      // Confirm connection success
      await client.db("admin").command({ ping: 1 });
      logger.info("Successfully connected to MongoDB!");
      return client; // Return the client so you can use it elsewhere if needed
    } catch (error) {
      logger.error(`Connection attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) {
        logger.error('Failed to connect to MongoDB after maximum retries');
        throw error; // Rethrow to handle errors in the main server logic
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Connection monitoring
client.on('connectionCreated', (event) => logger.info('New connection created'));
client.on('connectionClosed', (event) => logger.info('Connection closed'));
client.on('connectionPoolCreated', (event) => logger.info('Connection pool created'));

// Graceful shutdown function
async function closeConnection() {
  try {
    await client.close();
    logger.info("MongoDB connection closed.");
  } catch (err) {
    logger.error("Error closing MongoDB connection:", err);
  }
}

module.exports = { connectDB, closeConnection };