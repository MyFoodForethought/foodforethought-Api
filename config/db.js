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

const uri = process.env.MONGO_URI; // Use environment variable for MongoDB URI

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectDB() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
    return client;
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    throw error;
  }
}

module.exports = { connectDB };
