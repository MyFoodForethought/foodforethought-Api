// const mongoose = require('mongoose');

// async function connectDB() {
//     try {
//         await mongoose.connect(process.env.MONGO_URI, {
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


const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

// Use environment variables for sensitive information
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 30000 // Increase timeout
});

async function connectDB() {
  try {
    // Connect the client to the server
    await client.connect();
    // Confirm connection success
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
    return client; // Return the client so you can use it elsewhere if needed
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    throw error; // Rethrow to handle errors in the main server logic
  }
}

module.exports = { connectDB };
